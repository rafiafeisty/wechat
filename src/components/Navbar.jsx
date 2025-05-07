import React from 'react'
import { Link} from 'react-router-dom';
import './Navbar.css';
import {Container,Nav,Navbar,Button} from 'react-bootstrap';

const NavbarFun = () => {
    return (
        <>
        <Navbar expand="lg" className="bg-secondary fixed-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className='main'>WeChat</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" className='hover-home'>Home</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          <Button as={Link} to="/login" variant="outline-light mx-2">Login</Button>
          <Button as={Link} to="/signup" variant="outline-light mx-2">SignUp</Button>
        </Container>
      </Navbar>
      </>
      ); 
}

export default NavbarFun
