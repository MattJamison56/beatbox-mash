/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Button, Badge, Box, Typography, Stack } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const [eventCount, setEventCount] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);

  const ba_id = Number(localStorage.getItem('user_id')); // Get ba_id from localStorage

  useEffect(() => {
    fetchEventCount();
    fetchDocumentCount();
  }, []);

  const fetchEventCount = async () => {
    try {
      const response = await axios.get(`${apiUrl}/events/myevents/${ba_id}`);
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
      const trainingsCount = trainingResponse.data.filter((training: any) => !training.isCompleted)
        .length;

      setDocumentCount(docsCount + trainingsCount); // Sum of pending documents and trainings
    } catch (error) {
      console.error('Error fetching document or training count:', error);
    }
  };

  // Define the tasks with their respective counts and details
  const tasks = [
    {
      key: 'EVENTS',
      count: eventCount,
      color: 'primary',
      icon: <EventIcon fontSize="large" />,
      label: 'Work on Events',
    },
    {
      key: 'DOCUMENTS',
      count: documentCount,
      color: 'primary',
      icon: <AssignmentIcon fontSize="large" />,
      label: 'Finish Documents',
    },
    // You can add more tasks here in the future
  ];

  // Filter tasks that have counts greater than zero
  const pendingTasks = tasks.filter((task) => task.count > 0);

  return (
    <div style={{ color: 'black' }}>
      <h1>Dashboard</h1>
      <div style={{ color: 'black', textAlign: 'center' }}>
      <Box display="flex" justifyContent="center" alignItems="center">
        {pendingTasks.length > 0 ? (
          <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
            {pendingTasks.map((task) => (
              <div style={{display: 'flex', flexDirection: 'column'}}>
              <Button
                key={task.key}
                variant="contained"
                color={task.color as 'primary' | 'secondary'}
                onClick={() => onTabChange(task.key)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '100px',
                  padding: 2,
                }}
              >
                <Badge badgeContent={task.count} color="error">
                  {task.icon}
                </Badge>
              </Button>
              <Typography variant="body2" sx={{ marginTop: 1 }}>
                {task.label}
              </Typography>
              </div>
            ))}
          </Stack>
        ) : (
          <Typography variant="h6">No pending tasks</Typography>
        )}
      </Box>
      </div>
    </div>
  );
};

export default Dashboard;
