/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DayEventsModal from './dayEventsModal';
import './viewCalEventsPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface Ambassador {
  id: number;
  name: string;
  avatar_url: string;
  status: string;
}

interface Event {
  pendingAmbassadorsCount: number;
  acceptedAmbassadorsCount: number;
  declinedAmbassadorsCount: number;
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
  ambassadors: string | Ambassador[];
  venueAddress: string;
  paid: boolean;
  eventStatus: string;
  totalAmbassadorsCount: number;
}

const localizer = momentLocalizer(moment);

const eventStyleGetter = (event: Event) => {
  let borderColor = "#3174ad"; // Default color

  if (event.eventStatus === 'Upcoming') {
    if (event.acceptedAmbassadorsCount === event.totalAmbassadorsCount && event.totalAmbassadorsCount > 0) {
      // All ambassadors have accepted
      borderColor = "#32CD32"; // Green
    } else if (
      event.acceptedAmbassadorsCount === 0 &&
      (event.declinedAmbassadorsCount + event.pendingAmbassadorsCount === event.totalAmbassadorsCount)
    ) {
      // All ambassadors have declined or pending
      borderColor = "#FF6347"; // Red
    } else if (event.declinedAmbassadorsCount > 0 || event.pendingAmbassadorsCount > 0) {
      // Some ambassadors have declined or pending
      borderColor = "#FFA500"; // Orange
    }
  } else if (event.eventStatus === 'Completed') {
    if (event.paid) {
      // Event is paid
      borderColor = "#32CD32"; // Green
    } else {
      // Event is not paid yet
      borderColor = "#FFA500"; // Orange
    }
  }

  return {
    style: {
      border: `2px solid ${borderColor}`,
      backgroundColor: "transparent",
      color: "black",
      borderRadius: '5px',
      padding: "5px",
    },
  };
};


const EventCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // Allow null
  const [openModal, setOpenModal] = useState(false); // Manage modal open/close
  const [eventsForDay, setEventsForDay] = useState<Event[]>([]); // Store events for the selected day

  const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12; // Converts 24-hour format to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensures two-digit minutes
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/events/eventswithambassadors`);
      const data = await response.json();

      const formattedEvents = data.map((event: any) => {
        const startTime = formatTime(new Date(event.startDateTime));
        const endTime = formatTime(new Date(event.endDateTime));
      
        return {
          id: event.id,
          title: `${startTime} - ${endTime}, ${event.eventName}`,
          start: new Date(event.startDateTime),
          end: new Date(event.endDateTime),
          acceptedAmbassadorsCount: event.acceptedAmbassadorsCount,
          pendingAmbassadorsCount: event.pendingAmbassadorsCount,
          declinedAmbassadorsCount: event.declinedAmbassadorsCount,
          totalAmbassadorsCount: event.totalAmbassadorsCount,
          paid: event.paid, 
          eventStatus: event.eventStatus,
          ...event,
        };
      });      

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSelectEvent = (event: Event) => {
    // Filter events for the same day as the selected event
    const selectedDayEvents = events.filter(e =>
      new Date(e.start).toDateString() === new Date(event.start).toDateString()
    );

    setEventsForDay(selectedDayEvents); // Set the events for the selected day
    setSelectedEvent(event);            // Set the clicked event as selected
    setOpenModal(true);                 // Open the modal
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedEvent(null); // Reset selected event when closing modal
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
      setEvents(events.filter(event => event.id !== selectedEvent.id));  // Remove event from list
      setEventsForDay(eventsForDay.filter(event => event.id !== selectedEvent.id)); // Update day events
      handleCloseModal();
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
        style={{ height: 'calc(100vh - 100px)', width: '100%', color: 'black', marginTop: '20px' }}
        onSelectEvent={handleSelectEvent}  // Set event to open modal
        eventPropGetter={eventStyleGetter}  // Apply custom event styles
      />

      {/* Modal for Event Details */}
      {selectedEvent && (
        <DayEventsModal
          open={openModal}                  // Modal state
          handleClose={handleCloseModal}     // Close modal
          events={eventsForDay}              // Pass events for the selected day
          selectedEvent={selectedEvent}      // Pass selected event details
          setSelectedEvent={setSelectedEvent}  // Update selected event
          handleDeleteEvent={handleDeleteEvent} // Pass event delete handler
        />
      )}
    </div>
  );
};

export default EventCalendar;
