/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
const apiUrl = import.meta.env.VITE_API_URL;

const EventsList: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<null | any>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/events`);
      const data = await response.json();
      console.log(data);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, eventItem: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`${apiUrl}/events/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      console.log('Event deleted successfully');
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="container">
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Event Name</TableCell>
              <TableCell>Start Date & Time</TableCell>
              <TableCell>End Date & Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Staffing</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={index}>
                <TableCell>{event.team}</TableCell>
                <TableCell>{event.eventType}</TableCell>
                <TableCell>{event.eventName}</TableCell>
                <TableCell>{new Date(event.startDateTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(event.endDateTime).toLocaleString().replace(/:\d{2}\s/, ' ')}</TableCell>
                <TableCell>{`${event.duration_hours.toString()} hrs ${event.duration_minutes.toString()} min`}</TableCell>
                <TableCell>{event.staffing}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell>{event.campaign}</TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, event)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleDeleteEvent}>
                      <DeleteIcon color="error" /> Cancel
                    </MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default EventsList;
