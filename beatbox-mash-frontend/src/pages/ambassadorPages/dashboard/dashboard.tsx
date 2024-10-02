/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Button, Badge, Box } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const Dashboard: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [eventCount, setEventCount] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);

  const ba_id = localStorage.getItem('ba_id'); // Get ba_id from localStorage

  useEffect(() => {
    fetchEventCount();
    fetchDocumentCount();
  }, []);

  const fetchEventCount = async () => {
    try {
      const response = await axios.get(`${apiUrl}/events/myevents/${ba_id}`);
      // Assuming the response gives a count of events needing attention
      setEventCount(response.data.length); // If you return an array of pending events
    } catch (error) {
      console.error('Error fetching event count:', error);
    }
  };

  const fetchDocumentCount = async () => {
    try {
      const documentResponse = await axios.get(`${apiUrl}/docs/${ba_id}`);
      const trainingResponse = await axios.get(`${apiUrl}/training/${ba_id}`);

      const docsCount = documentResponse.data.filter((doc: any) => !doc.isUploaded).length;
      const trainingsCount = trainingResponse.data.filter((training: any) => !training.isCompleted).length;

      setDocumentCount(docsCount + trainingsCount); // Sum of pending documents and trainings
    } catch (error) {
      console.error('Error fetching document or training count:', error);
    }
  };

  return (
    <div style={{ color: 'black' }}>
      <h1> Dashboard </h1>
      <Box display="flex" justifyContent="space-around">
        <Button
          variant="contained"
          color="primary"
          startIcon={
            <Badge badgeContent={eventCount} color="error">
              <EventIcon />
            </Badge>
          }
          onClick={() => onTabChange('EVENTS')}
        >
          View Pending Events
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={
            <Badge badgeContent={documentCount} color="error">
              <AssignmentIcon />
            </Badge>
          }
          onClick={() => onTabChange('DOCUMENTS')}
        >
          View Required Documents/Trainings
        </Button>
      </Box>
    </div>
  );
};

export default Dashboard;
