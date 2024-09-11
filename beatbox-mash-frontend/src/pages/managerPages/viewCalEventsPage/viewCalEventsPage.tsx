/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import './viewCalEventsPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  team: string;
  eventType: string;
  eventName: string;
  staffing: string;
  status: string;
  venue: string;
  campaign: string;
  duration_hours: number;
  duration_minutes: number;
}

const localizer = momentLocalizer(moment);

const EventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<null | Event>(null);

  // Fetch Events
  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/events`);
      const data = await response.json();
      // Map the fetched events to the format needed for react-big-calendar
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: event.eventName,
        start: new Date(event.startDateTime),
        end: new Date(event.endDateTime),
        ...event, // Spread the rest of the event data for modal display
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle Event Click to Open Menu or Modal
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  // Handle Event Deletion
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
      <h1 className="title">Calendar View</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleSelectEvent} // Handle event click
      />

      {/* Modal for Event Details */}
      {selectedEvent && (
        <div className="modal">
          <h2>{selectedEvent.title}</h2>
          <p><strong>Team:</strong> {selectedEvent.team}</p>
          <p><strong>Event Type:</strong> {selectedEvent.eventType}</p>
          <p><strong>Staffing:</strong> {selectedEvent.staffing}</p>
          <p><strong>Status:</strong> {selectedEvent.status}</p>
          <p><strong>Venue:</strong> {selectedEvent.venue}</p>
          <p><strong>Campaign:</strong> {selectedEvent.campaign}</p>
          <p><strong>Duration:</strong> {selectedEvent.duration_hours} hrs {selectedEvent.duration_minutes} min</p>
          <p><strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
          <IconButton onClick={handleDeleteEvent}>
            <DeleteIcon color="error" /> Cancel Event
          </IconButton>
          <button onClick={handleMenuClose}>Close</button>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
