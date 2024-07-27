import React, { useState, useEffect } from 'react';
import {
  Box, Typography, List, Divider, Button, Card, CardContent, Grid, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { styled } from '@mui/system';
import ReportForm from '../../../components/reportForm/reportForm';

interface Event {
  id: number;
  eventName: string;
  startDateTime: string;
  endDateTime: string;
  team: string;
  venue: string;
  campaign: string;
  inventory: boolean;
  qa: boolean;
  photos: boolean;
  expenses: boolean;
}

const formatEventDateTime = (startDateTime: string, endDateTime: string) => {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };

  const formattedStart = startDate.toLocaleDateString('en-US', options);
  const formattedEnd = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });

  const durationHours = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const durationMinutes = ((endDate.getTime() - startDate.getTime()) / (1000 * 60)) % 60;

  return `${formattedStart} - ${formattedEnd} (${durationHours} hrs ${durationMinutes} min)`;
};

const isReportOverdue = (endDateTime: string) => {
  const endDate = new Date(endDateTime);
  const now = new Date();
  const diffInHours = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
  return diffInHours > 24;
};

interface ReportStatusProps {
  status: 'overdue' | 'required';
}

const ReportStatus = styled('div')<ReportStatusProps>(({ status }) => ({
  borderRadius: '16px',
  padding: '4px 8px',
  color: '#fff',
  backgroundColor: status === 'overdue' ? 'orange' : 'orange',
  border: `1px solid ${status === 'overdue' ? 'orange' : 'orange'}`,
  display: 'inline-block',
  textAlign: 'center',
  minWidth: '50px',
}));

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEventIds, setExpandedEventIds] = useState<number[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const ba_id = localStorage.getItem('ba_id');
      if (!ba_id) {
        console.error('No ba_id found in local storage');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/events/myevents/${ba_id}`);
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedEventIds((prev) =>
      prev.includes(id) ? prev.filter((eventId) => eventId !== id) : [...prev, id]
    );
  };

  const handleOpenModal = (event: Event) => {
    setSelectedEvent(event);
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  return (
    <Box padding={2}>
      <h1 style={{color: 'black'}}>My Events</h1>
      <List>
        {events.map((event) => (
          <React.Fragment key={event.id}>
            <Card variant="outlined" style={{ marginBottom: '16px' }}>
              <CardContent>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={2}>
                    {isReportOverdue(event.endDateTime) ? (
                      <ReportStatus status="overdue">Report Overdue</ReportStatus>
                    ) : (
                      <ReportStatus status="required">Report Required</ReportStatus>
                    )}
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      {formatEventDateTime(event.startDateTime, event.endDateTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {event.eventName}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      {event.campaign}
                    </Typography>
                  </Grid>
                  <Grid item xs={1.6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{ marginRight: '8px' }}
                      onClick={() => handleOpenModal(event)}
                    >
                      Details
                    </Button>
                  </Grid>
                  <Grid item xs={0.4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => toggleExpand(event.id)}>
                      {expandedEventIds.includes(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Grid>
                  {expandedEventIds.includes(event.id) && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Venue: {event.venue}
                        </Typography>
                        <Typography variant="body2">
                          Team: {event.team}
                        </Typography>
                        <Typography variant="body2">
                          Inventory: {event.inventory ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2">
                          QA: {event.qa ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2">
                          Photos: {event.photos ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2">
                          Expenses: {event.expenses ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            style={{ marginBottom: '16px' }}
                            onClick={() => handleOpenModal(event)}
                          >
                            Fill Out Report
                          </Button>
                          <Button variant="outlined" color="secondary">
                            Decline
                          </Button>
                        </div>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      {selectedEvent && (
        <ReportForm
          open={openModal}
          handleClose={handleCloseModal}
          eventName={selectedEvent.eventName}
          startTime={formatEventDateTime(selectedEvent.startDateTime, selectedEvent.endDateTime)}
        />
      )}
    </Box>
  );
};

export default Events;
