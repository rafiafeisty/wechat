import { Button, Form, Card, Alert } from 'react-bootstrap';
import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    console.log("Sending login request:", { email, password }); // Debug log
  
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log("Login response:", response.data); // Debug log
      localStorage.setItem('userEmail', email);
      if (response.data.publicKey) {
        localStorage.setItem('publicKey', response.data.publicKey);
      }
  
      navigate('/start');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="login-page-background"></div>
    <div className='styling'>
      <Card style={{ width: '25rem', height: error ? '28rem' : '25rem' }} className='ms-10'>
        <Card.Body>
          <Card.Title>Login</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter email" 
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                required
              />
            </Form.Group>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Submit'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
    </>
  );
};

export default Login;