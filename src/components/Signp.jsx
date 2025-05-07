import { Button, Form, Card, Alert } from 'react-bootstrap';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password1: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one digit');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('one special character');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password1 !== formData.password2) {
      return setError('Passwords do not match');
    }

    const passwordErrors = validatePassword(formData.password1);
    if (passwordErrors.length > 0) {
      return setError(`Password must contain: ${passwordErrors.join(', ')}`);
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        email: formData.email,
        password: formData.password1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.status === 201) {
        navigate('/login', { state: { success: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page-background"></div>
      <div className='styling'>
        <Card style={{ width: '25rem', height: 'auto' }}>
          <Card.Body>
            <Card.Title className="text-center">Sign Up</Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                  autoComplete="email"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword1">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password1"
                  value={formData.password1}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  minLength="8"
                  autoComplete="new-password"
                />
                <Form.Text muted>
                  Must contain: 8+ chars, upper/lowercase, number, special char
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword2">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                />
              </Form.Group>

              <Button variant="success" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Submit'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default Signup;