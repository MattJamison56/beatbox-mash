import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

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

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);

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

  return (
    <Box padding={2}>
      <h1 style={{color: 'black' }}>My Events</h1>
      <List>
        {events.map((event) => (
          <React.Fragment key={event.id}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={event.eventName}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      {event.startDateTime} - {event.endDateTime}
                    </Typography>
                    <br />
                    Team: {event.team}
                    <br />
                    Venue: {event.venue}
                    <br />
                    Campaign: {event.campaign}
                    <br />
                    Inventory: {event.inventory ? 'Yes' : 'No'}
                    <br />
                    QA: {event.qa ? 'Yes' : 'No'}
                    <br />
                    Photos: {event.photos ? 'Yes' : 'No'}
                    <br />
                    Expenses: {event.expenses ? 'Yes' : 'No'}
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default Events;
