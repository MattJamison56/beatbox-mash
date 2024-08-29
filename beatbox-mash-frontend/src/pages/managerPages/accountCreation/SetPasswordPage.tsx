// src/pages/account/SetPasswordPage.tsx
import React, { useState } from 'react';
import { TextField, Button, Container } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL;

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/account/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set password');
      }

      console.log('Password set successfully');
      navigate('/login');
    } catch (error) {
      const err = error as Error;
      console.error('Error setting password:', err.message);
    }
  };

  return (
    <Container>
      <h1 className='title'>Set Password</h1>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">Set Password</Button>
      </form>
    </Container>
  );
};

export default SetPasswordPage;
