import React, { useState } from 'react';
import './login.css';
import logo from '../../assets/beatboxlogo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <img src={logo} alt="Logo" className="logologin" />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Username/Email address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Sign In</button>
        </form>
        <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
      </div>
    </div>
  );
};

export default LoginPage;
