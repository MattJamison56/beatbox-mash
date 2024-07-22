import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Paper } from '@mui/material';

const CreateTeamsPage: React.FC = () => {
  const [teamName, setTeamName] = useState('');

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('http://localhost:5000/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: teamName }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setTeamName(''); // Clear the input field
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper style={{ padding: '2rem', marginTop: '2rem' }}>
        <Typography variant="h4" gutterBottom>
          Create a New Team
        </Typography>
        <TextField
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleCreateTeam}>
          Create Team
        </Button>
      </Paper>
    </Container>
  );
};

export default CreateTeamsPage;
