import React from 'react'
import { Link} from 'react-router-dom';
import './Navbar.css';
import {Container,Nav,Navbar,Button} from 'react-bootstrap';

const Navbar2 = () => {
  return (
    <>
    <Navbar  expand="lg" className="bg-secondary fixed-top" style={{zIndex:"15", position:"relative"}}>
    <Container>
      <Navbar.Brand as={Link} to="/" className='main'>WeChat</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
        </Nav>
      </Navbar.Collapse>
      <Button as={Link} to="/" variant="outline-light mx-2">Logout</Button>
    </Container>
  </Navbar>
  </>
  )
}

export default Navbar2
