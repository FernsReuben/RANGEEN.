// src/components/Header.jsx
import React from 'react';

const Header = () => (
  <header style={{
    marginBottom: '40px',
    textAlign: 'center',
    padding: '20px 0'
  }}>
    <h1 style={{
      fontFamily: "'Glass Marbles'",
      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
      textShadow: '3px 3px 10px rgba(0,0,0,0.5)',
      letterSpacing: '3px'
    }}>
      Rangeen
    </h1>
    <p style={{
      fontFamily: "'Special Gothic Expanded', sans-serif",
      color: 'rgba(255,255,255,0.95)',
      fontSize: '1.3rem',
      margin: '10px 0 0 0',
      textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
    }}>
      Faber-Castell Polychromos Color Matcher
    </p>
  </header>
);

export default Header;
