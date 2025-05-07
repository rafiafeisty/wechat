require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();

app.use(
  cors({
    origin: " https://39a8-103-115-199-194.ngrok-free.app",
    credentials: true,
  })
);
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/wechat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Encryption key for AES-256-CBC (must be 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);
const IV_LENGTH = 16;

// Function to encrypt text
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAttempt: { type: Date, default: Date.now },
});

const partialPublicKeySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  partialPrivateKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const PartialPublicKey = mongoose.model("PartialPublicKey", partialPublicKeySchema);

const contactSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, ref: "User" },
  contactEmail: { type: String, required: true, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  senderEmail: String,
  message: String,
  signature: String,
  timestamp: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false }
});

const chatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }],
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now }
});

const Chat = mongoose.model("Chat", chatSchema);
contactSchema.index({ userEmail: 1, contactEmail: 1 }, { unique: true });
const Contact = mongoose.model("Contact", contactSchema);

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    let publicKey, privateKey;
    try {
      const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
      if (!publicKey || !privateKey || publicKey.length < 50 || privateKey.length < 50) {
        throw new Error("Invalid key length");
      }
    } catch (keyError) {
      return res.status(500).json({ error: "Key generation failed", details: keyError.message });
    }

    const encryptedPrivateKey = encrypt(privateKey);
    const privateKeyHalfLength = Math.ceil(privateKey.length / 2);
    const partialPrivateKey = privateKey.slice(0, privateKeyHalfLength);
    const encryptedPartialPrivateKey = encrypt(partialPrivateKey);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      publicKey,
      privateKey: encryptedPrivateKey,
      createdAt: new Date(),
      lastLoginAttempt: new Date(),
    });

    try {
      await user.save();
      const partialKeyEntry = new PartialPublicKey({ email, partialPrivateKey: encryptedPartialPrivateKey });
      await partialKeyEntry.save();
      return res.status(201).json({ message: "User registered successfully", userEmail: email });
    } catch (saveError) {
      return res.status(500).json({ error: "Registration failed", details: saveError.message });
    }
  } catch (err) {
    return res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

const authenticateUser = async (req, res, next) => {
  try {
    const userEmail = req.headers["x-user-email"];
    if (!userEmail) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Authentication failed" });
  }
};

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const now = new Date();
      const diffTime = now - new Date(user.lastLoginAttempt);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays > 60) {
        await Contact.deleteMany({ $or: [{ userEmail: email }, { contactEmail: email }] });
        await Chat.deleteMany({ participants: email });
        await PartialPublicKey.deleteOne({ email });
        return res.status(403).json({
          error: "Dead Man Alert: Account inactive for 2+ months and wrong credentials. Data removed.",
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    user.lastLoginAttempt = new Date();
    await user.save();
    const decryptedPrivateKey = decrypt(user.privateKey);

    res.json({
      message: "Login successful",
      userEmail: user.email,
      publicKey: user.publicKey,
      privateKey: decryptedPrivateKey,
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

app.get("/api/users/check", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: "Error checking user existence" });
  }
});

app.post("/api/contacts/add", authenticateUser, async (req, res) => {
  try {
    const { contactEmail } = req.body;
    const userEmail = req.user.email;
    if (!contactEmail) {
      return res.status(400).json({ error: "Contact email is required" });
    }
    const contactUser = await User.findOne({ email: contactEmail });
    if (!contactUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (userEmail === contactEmail) {
      return res.status(400).json({ error: "Cannot add yourself as a contact" });
    }
    const existingContact = await Contact.findOne({ userEmail, contactEmail });
    if (existingContact) {
      return res.status(400).json({ error: "Contact already exists" });
    }
    const contact = new Contact({ userEmail, contactEmail });
    await contact.save();
    res.json({ message: "Contact added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add contact" });
  }
});

app.get("/api/users/details", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email });
    if (!user) return res.status(404).json({ error: "User not found" });
    const decryptedPrivateKey = decrypt(user.privateKey);
    res.json({ publicKey: user.publicKey, privateKey: decryptedPrivateKey });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user details" });
  }
});

app.get("/api/contacts", authenticateUser, async (req, res) => {
  try {
    const contacts = await Contact.find({ userEmail: req.user.email });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/api/chat/send", authenticateUser, async (req, res) => {
  try {
    const { receiverEmail, message, signature } = req.body;
    const senderEmail = req.user.email;
    if (!receiverEmail || !message || !signature) {
      return res.status(400).json({ error: "Receiver email, message, and signature are required" });
    }
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const participants = [senderEmail, receiverEmail].sort();
    let chat = await Chat.findOne({ participants: { $all: participants } });

    const newMessage = {
      senderEmail,
      message,
      signature,
      timestamp: new Date(),
      verified: true
    };

    if (!chat) {
      chat = new Chat({
        participants,
        messages: [newMessage],
        lastUpdated: new Date()
      });
    } else {
      chat.messages.push(newMessage);
      chat.lastUpdated = new Date();
    }

    await chat.save();
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/chat/messages", authenticateUser, async (req, res) => {
  try {
    const { contactEmail } = req.query;
    const userEmail = req.user.email;
    if (!contactEmail) {
      return res.status(400).json({ error: "Contact email is required" });
    }
    const participants = [userEmail, contactEmail].sort();
    const chat = await Chat.findOne({ participants: { $all: participants } });
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.get("/api/chat/messaging-contacts", authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const chats = await Chat.find({ participants: userEmail });
    const contacts = chats.map(chat => 
      chat.participants.find(email => email !== userEmail)
    ).filter(Boolean);
    
    res.json(contacts.map(contactEmail => ({ contactEmail })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messaging contacts" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});