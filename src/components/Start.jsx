import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import './Chat.css';
import { Button, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Start = () => {
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail"));
    const [contacts, setContacts] = useState([]); 
    const allemails = useRef(null);
    const navigate = useNavigate();

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const fetchContacts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/contacts', {
                headers: {
                    'x-user-email': userEmail
                }
            });
            setContacts(response.data);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    useEffect(() => {
        fetchContacts(); 
    }, []);

    const checkingemail = async () => {
        if (email !== '') {
            try {
                const checkResponse = await axios.get(`http://localhost:5000/api/users/check?email=${email}`);
                if (checkResponse.data.exists) {
                    const addResponse = await axios.post(
                        'http://localhost:5000/api/contacts/add',
                        { contactEmail: email },
                        {
                            headers: {
                                'x-user-email': userEmail
                            }
                        }
                    );
                    alert(addResponse.data.message);
                    fetchContacts(); 
                } else {
                    alert("Email does not exist");
                }
            } catch (error) {
                console.error("Error checking or adding contact:", error);
                if (error.response && error.response.data?.error) {
                    alert(error.response.data.error);
                } else {
                    alert("Something went wrong.");
                }
            }
        }
        setShow(false);
        setEmail('');
    };

    return (
        <>
            <div className='main-div'>
                <div className='center-text2'>
                    <button onClick={handleShow} style={{ marginBottom: '20px' }} className="send-icon-button" type="button">Add New Contact</button>
                </div>
                <div className='contact'>
                    {contacts.map((contact, index) => (
                        <button onClick={()=>navigate('/chat')} className='contact-btn' key={index}>
                            {contact.contactEmail}
                        </button>
                    ))}
                </div>

                <div className='side-based'></div>
                <HeroImage src="https://img.freepik.com/premium-vector/conversation-people-talking-chat-comment-communication-conference-consultation-debate_909058-1373.jpg" alt="Chat illustration" />
                <div className='center-text'>
                    <center>
                        <h3 style={{ fontSize: '3rem', fontStyle: 'Bold' }}>Welcome To WeChat</h3>
                        <p style={{ fontSize: '2rem' }}>Select or Add the contact from the side to Chat</p>
                    </center>
                </div>
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

const HeroImage = styled.img`
  flex: 1;
  max-width: 150vh;
  height: 100vh;
  opacity: 0.5;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export default Start;
