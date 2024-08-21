import React, { useState } from 'react';
import './login.css';
import logo from '../../assets/beatboxlogo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error message
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const message = await response.json(); // Parse the error message
        setErrorMessage(message.message || 'Login failed'); // Set the error message
        return;
      }

      const data = await response.json();

      // Use login from the context to update the state
      login(data.role, data.token);
      localStorage.setItem('ba_id', data.ba_id); // This can stay in localStorage

      navigate('/');
    } catch (error) {
      setErrorMessage('An error occurred during login. Please try again.'); // Set a generic error message
      console.error('Error logging in:', error);
    }
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
          {errorMessage && <div className="error-message">{errorMessage}</div>} {/* Display error message */}
          <button type="submit" className="login-button">Sign In</button>
        </form>
        <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
      </div>
    </div>
  );
};

export default LoginPage;
