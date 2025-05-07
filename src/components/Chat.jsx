import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import { Button, Modal, Form,Dropdown ,DropdownButton} from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messageEndRef = useRef(null);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail"));
  const [contacts, setContacts] = useState([]);
  const [messagingContacts, setMessagingContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const addDummy = (data) => {
    return data + data;
  };

  const removeDummy = (data) => {
    return data.substring(0, data.length / 2);
  };

 // Update the delete functions to include confirmations
const handleDeleteChat = async () => {
  if (!selectedContact) return;
  
  if (!window.confirm("Are you sure you want to delete this chat for all participants?")) {
    return;
  }

  try {
    await axios.delete('http://localhost:5000/api/chat/delete-chat', {
      data: { contactEmail: selectedContact },
      headers: { 'x-user-email': userEmail }
    });
    
    setMessages([]);
    fetchMessagingContacts();
    alert("Chat deleted successfully");
  } catch (error) {
    console.error("Error deleting chat:", error);
    alert(`Failed to delete chat: ${error.response?.data?.error || error.message}`);
  }
};

const handleDeleteAllRecords = async () => {
  if (!selectedContact) return;
  
  if (!window.confirm("Are you sure you want to delete ALL records of this chat, including the contact? This cannot be undone.")) {
    return;
  }

  try {
    await axios.delete('http://localhost:5000/api/chat/delete-all-records', {
      data: { contactEmail: selectedContact },
      headers: { 'x-user-email': userEmail }
    });
    
    setMessages([]);
    setSelectedContact(null);
    fetchContacts();
    fetchMessagingContacts();
    alert("All records deleted successfully");
  } catch (error) {
    console.error("Error deleting records:", error);
    alert(`Failed to delete records: ${error.response?.data?.error || error.message}`);
  }
};
  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contacts', {
        headers: { 'x-user-email': userEmail }
      });
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchMessagingContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat/messaging-contacts', {
        headers: { 'x-user-email': userEmail }
      });
      setMessagingContacts(response.data);
    } catch (error) {
      console.error("Error fetching messaging contacts:", error);
    }
  };

  const fetchMessages = async (contactEmail) => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat/messages', {
        params: { contactEmail },
        headers: { 'x-user-email': userEmail }
      });

      // The response now contains a messages array inside the data object
      const messagesArray = response.data.messages || response.data; // Fallback to response.data for backward compatibility

      const processedMessages = await Promise.all(
        messagesArray.map(async (msg) => {
          try {
            // Decode the message - note the field is now 'content' but falls back to 'message'
            const messageContent = msg.content || msg.message;
            const decodeResponse = await axios.post('http://localhost:5001/decrypt', {
              encoded: messageContent
            });

            // Verify signature
            const verifyResponse = await axios.post('http://localhost:5001/verify', {
              senderEmail: msg.senderEmail,
              message: messageContent,
              signature: msg.signature || msg.signature // Handle potential typo in backend
            });

            return {
              ...msg,
              message: removeDummy(decodeResponse.data.decoded),
              verified: verifyResponse.data.verified
            };
          } catch (error) {
            return {
              ...msg,
              message: "[Error processing message]",
              verified: false
            };
          }
        })
      );

      setMessages(processedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchContacts();
      fetchMessagingContacts();
    }
  }, [userEmail]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
    }
  }, [selectedContact, userEmail]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkingemail = async () => {
    if (email !== '') {
      try {
        const checkResponse = await axios.get(`http://localhost:5000/api/users/check?email=${email}`);
        if (checkResponse.data.exists) {
          const addResponse = await axios.post(
            'http://localhost:5000/api/contacts/add',
            { contactEmail: email },
            { headers: { 'x-user-email': userEmail } }
          );
          alert(addResponse.data.message);
          fetchContacts();
        } else {
          alert("Email does not exist");
        }
      } catch (error) {
        console.error("Error checking or adding contact:", error);
        alert(error.response?.data?.error || "Something went wrong.");
      }
    }
    setShow(false);
    setEmail('');
  };

  const handleSend = async () => {
    if (message.trim() === "" || !selectedContact) return;

    try {
      // 1. Add dummy data
      const dummyMessage = addDummy(message);

      // 2. Encode the message
      const encodeResponse = await axios.post('http://localhost:5001/encrypt', {
        message: dummyMessage
      });

      // 3. Sign the encoded message
      const signResponse = await axios.post('http://localhost:5001/sign', {
        senderEmail: userEmail,
        message: encodeResponse.data.encoded
      });

      // 4. Send to backend
      await axios.post(
        'http://localhost:5000/api/chat/send',
        {
          receiverEmail: selectedContact,
          message: signResponse.data.message,
          signature: signResponse.data.signature || signResponse.data.signature // Handle potential typo
        },
        { headers: { 'x-user-email': userEmail } }
      );

      fetchMessages(selectedContact);
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleContactSelect = (contactEmail) => {
    setSelectedContact(contactEmail);
    fetchMessages(contactEmail);
  };

  const allContacts = [
    ...contacts.map(c => ({ contactEmail: c.contactEmail, type: 'manual' })),
    ...messagingContacts.map(c => ({ contactEmail: c.contactEmail, type: 'messaging' }))
  ].reduce((unique, item) =>
    unique.some(u => u.contactEmail === item.contactEmail) ? unique : [...unique, item],
    []);

  return (
    <>
     <div className='main-div'>
      <div className="background"></div>
      <div className='center-text2'>
        <button onClick={handleShow} style={{ marginBottom: '20px' }} className="send-icon-button" type="button">
          Add New Contact
        </button>
      </div>
      <div className='contact'>
        {allContacts.map((contact, index) => (
          <button
            onClick={() => handleContactSelect(contact.contactEmail)}
            className={`contact-btn ${selectedContact === contact.contactEmail ? 'active' : ''}`}
            key={index}
          >
            {contact.contactEmail}
          </button>
        ))}
      </div>
      <div className='side-based'></div>
        {!selectedContact && (
          <HeroImageContainer>
            <HeroImage
              src="https://img.freepik.com/premium-vector/conversation-people-talking-chat-comment-communication-conference-consultation-debate_909058-1373.jpg"
              alt="Chat illustration"
            />
            <HeroText>Select a contact to start chatting</HeroText>
          </HeroImageContainer>
        )}
        {selectedContact && (
          <>
            <div className='chat-background'></div>
            <div className="message-container">
            <div className='message-header'>
              <h5>{selectedContact}</h5>
              {[''].map(
        (direction) => (
          <div style={{display:"flex",justifyContent:"space-between"}}>
          <DropdownButton style={{border:"black"}}
            key={direction}
            id={`dropdown-button-drop-${direction}`}
            drop={direction}
            variant='none'
            title={`${direction}`}
          >
            <Dropdown.Item eventKey="1"  onClick={handleDeleteChat}>Delete Chat for all</Dropdown.Item>
            <Dropdown.Item eventKey="2" onClick={handleDeleteAllRecords}>Delete All Records of Chat</Dropdown.Item>
          </DropdownButton>
          </div>
        ),
      )}
            </div>
            <div style={{paddingTop:"40px"}}></div>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.senderEmail === userEmail ? 'sent' : 'received'} ${msg.verified ? 'verified' : 'unverified'} show`}
                >
                  <div className="message-content">
                    {msg.message}
                    {!msg.verified && (
                      <span className="verification-warning"> (unverified)</span>
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef}></div>
            </div>
          </>
        )}

        {selectedContact && (
          <div className="text-writing">
            <div className="input-group mb-3">
              <input
                type="text"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="form-control w-30"
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="send-icon-button" type="button">
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter email"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={checkingemail}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Chat;

const HeroImageContainer = styled.div`
  position: fixed;  
  top: 60px;      
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  z-index: 1;      
`;

const HeroImage = styled.img`
  max-width: 60%;
  max-height: 60%;
  opacity: 0.7;
`;

const HeroText = styled.div`
  margin-top: 20px;
  font-size: 24px;
  color: #666;
  text-align: center;
`;