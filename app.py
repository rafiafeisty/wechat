from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import traceback
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding, ec
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://39a8-103-115-199-194.ngrok-free.app"]}})

NODE_BACKEND_URL = "http://localhost:5000"

@app.route('/encrypt', methods=['POST'])
def encrypt_message():
    try:
        data = request.get_json()
        message = data.get('message')

        if not message:
            return jsonify({"error": "Missing message"}), 400

        # Encode the message to URL-safe base64 (no special chars)
        encoded_bytes = base64.urlsafe_b64encode(message.encode('utf-8'))
        encoded_message = encoded_bytes.decode('utf-8').rstrip('=')  # Remove padding
        
        return jsonify({
            "encoded": encoded_message,
            "note": "URL-safe Base64 encoding used (A-Z, a-z, 0-9, - and _ only)"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Encoding failed",
            "details": str(e),
            "trace": traceback.format_exc()
        }), 500

@app.route('/decrypt', methods=['POST'])
def decrypt_message():
    try:
        data = request.get_json()
        encoded = data.get('encoded')

        if not encoded:
            return jsonify({"error": "Missing encoded field"}), 400

        encoded = encoded.strip()
        
        # Add padding if needed for URL-safe base64
        padding_needed = len(encoded) % 4
        if padding_needed:
            encoded += '=' * (4 - padding_needed)

        try:
            # Always use urlsafe decode since we're using URL-safe encoding
            decoded_bytes = base64.urlsafe_b64decode(encoded)
            decoded_message = decoded_bytes.decode('utf-8')
            
            return jsonify({"decoded": decoded_message}), 200
            
        except (base64.binascii.Error, UnicodeDecodeError) as e:
            return jsonify({
                "error": "Decoding failed",
                "details": str(e),
                "input_received": encoded
            }), 400

    except Exception as e:
        return jsonify({
            "error": "Server error",
            "details": str(e)
        }), 500
    
@app.route('/sign', methods=['POST'])
def sign_message():
    try:
        data = request.get_json()
        sender_email = data.get('senderEmail')
        message = data.get('message')

        if not all([sender_email, message]):
            return jsonify({"error": "Missing required fields"}), 400

        # Get sender's private key from Node backend
        response = requests.get(
            f"{NODE_BACKEND_URL}/api/users/details?email={sender_email}",
            headers={'x-user-email': sender_email}
        )
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to get user's private key"}), response.status_code
            
        private_key_pem = response.json().get('privateKey')
        
        if not private_key_pem:
            return jsonify({"error": "Private key not found for user"}), 404

        # Validate private key format
        if "BEGIN PRIVATE KEY" not in private_key_pem or "END PRIVATE KEY" not in private_key_pem:
            return jsonify({"error": "Invalid private key format"}), 400

        try:
            # Load private key
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode('utf-8'),
                password=None,
                backend=default_backend()
            )
        except ValueError as e:
            return jsonify({
                "error": "Failed to load private key",
                "details": str(e),
                "key_snippet": private_key_pem[:100] + "..." if private_key_pem else "None"
            }), 400

        # Sign the message (using ECDSA)
        signature = private_key.sign(
            message.encode('utf-8'),
            ec.ECDSA(hashes.SHA256())
        )
                
        return jsonify({
            "message": message,
            "signature": base64.b64encode(signature).decode('utf-8'),
            "algorithm": "ECDSA"
        }), 200
            
    except Exception as e:
        return jsonify({
            "error": "Signing failed",
            "details": str(e),
            "trace": traceback.format_exc()
        }), 500

@app.route('/verify', methods=['POST'])
def verify_message():
    try:
        data = request.get_json()
        sender_email = data.get('senderEmail')
        message = data.get('message')
        signature_b64 = data.get('signature')

        if not all([sender_email, message, signature_b64]):
            return jsonify({"error": "Missing required fields"}), 400

        # Get sender's public key
        response = requests.get(
            f"{NODE_BACKEND_URL}/api/users/details?email={sender_email}",
            headers={'x-user-email': sender_email}
        )
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to get sender's public key"}), response.status_code
            
        public_key_pem = response.json().get('publicKey')
        
        if not public_key_pem:
            return jsonify({"error": "Public key not found for sender"}), 404

        # Load public key
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )

        # Verify the signature
        signature = base64.b64decode(signature_b64)
        
        try:
            public_key.verify(
                signature,
                message.encode('utf-8'),
                ec.ECDSA(hashes.SHA256())
            )
                
            return jsonify({
                "verified": True,
                "message": "Signature is valid",
                "algorithm": "ECDSA"
            }), 200
            
        except InvalidSignature:
            return jsonify({
                "verified": False,
                "message": "Signature is invalid"
            }), 200
        except Exception as e:
            return jsonify({
                "error": "Verification failed",
                "details": str(e)
            }), 500

    except Exception as e:
        return jsonify({
            "error": "Server error during verification",
            "details": str(e),
            "trace": traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)