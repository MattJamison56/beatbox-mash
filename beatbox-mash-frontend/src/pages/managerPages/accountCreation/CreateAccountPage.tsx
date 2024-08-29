// src/pages/account/CreateAccountPage.tsx
import React, { useState } from 'react';
import { TextField, Button, Container, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL;

const CreateAccountPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('manager');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !role) {
      setErrorMessage('Email and role are required');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/account/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send account creation email');
      }

      console.log('Email sent successfully');
      navigate('/');
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message);
      console.error('Error creating account:', error);
    }
  };

  return (
    <Container>
      <h1 className='title'>Create Account</h1>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">Create Account</Button>
      </form>
      {errorMessage && (
        <Snackbar open autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
          <Alert onClose={() => setErrorMessage(null)} severity="error">
            {errorMessage}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default CreateAccountPage;
