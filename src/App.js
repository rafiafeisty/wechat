import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import SignUp from './components/Signp';
import NavbarFun from './components/Navbar';
import Navbar2 from './components/Navbar2';
import Home from './components/Home';
import Chat from './components/Chat';
import Start from './components/Start';

function NavWrapper() {
  const location = useLocation();
  
  // Debugging: log the current path
  console.log('Current path:', location.pathname);
  
  return (
    <>
      {location.pathname === '/chat' || location.pathname === '/start' ? <Navbar2 /> : <NavbarFun />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/start" element={<Start />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <NavWrapper />
      </div>
    </Router>
  );
}

export default App;