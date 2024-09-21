/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Modal, Box, Typography, Avatar, Button, CircularProgress, Checkbox, Tab, Tabs, TextField, Link } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const apiUrl = import.meta.env.VITE_API_URL;

interface Ambassador {
  id: number;
  name: string;
  avatar_url: string;
  wage: number;
  inventory: boolean;
  qa: boolean;
  photos: boolean;
  expenses: boolean;
  status: string;
  personal_report_submitted: boolean;
}

interface EventDetails {
  id: number;
  event_name: string;
  startDateTime: string;
  endDateTime: string;
  duration_hours: number;
  duration_minutes: number;
  venueName: string;
  venueAddress: string;
  ambassadors: Ambassador[];
  paid: boolean;
  report_submitted: boolean;
  team: string;
  campaign: string;
}

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  eventId: number;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ open, onClose, eventId }) => {
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // To handle tabs

  useEffect(() => {
    if (eventId && open) {
      fetchEventDetails();
    }
  }, [eventId, open]);
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/events/details/${eventId}`);
      const data = await response.json();
  
      // Parse ambassadors if it's a JSON string
      if (typeof data.ambassadors === 'string') {
        data.ambassadors = JSON.parse(data.ambassadors);
      }
  
      // Make sure ambassadors is always an array
      if (!Array.isArray(data.ambassadors)) {
        data.ambassadors = [];
      }
  
      setEventDetails(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue);
  };

  const renderTabs = () => {
    if (tabIndex === 0) {
      // Assigned Ambassadors Tab Content
      return (
        <Box>
          <Typography variant="h6" sx={{ marginBottom: '10px', color: 'black' }}>
            Assigned Brand Ambassadors ({eventDetails?.ambassadors.length})
          </Typography>
          <Box>
            {eventDetails?.ambassadors.map((ambassador) => (
              <Box
                key={ambassador.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                }}
              >
                <Avatar
                  src={ambassador.avatar_url}
                  alt={ambassador.name}
                  sx={{ width: 50, height: 50, marginRight: '20px' }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>
                    {ambassador.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'gray' }}>
                    Wage: ${ambassador.wage}/h | {ambassador.status}
                  </Typography>
                </Box>
                <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                  <Checkbox checked={ambassador.inventory} disabled />
                  <Checkbox checked={ambassador.qa} disabled />
                  <Checkbox checked={ambassador.photos} disabled />
                  <Checkbox checked={ambassador.expenses} disabled />
                </Box>
              </Box>
            ))}
          </Box>

          <TextField
            placeholder="Start typing brand ambassador name"
            variant="outlined"
            fullWidth
            sx={{ marginTop: '20px' }}
          />
          <Link
            href="#"
            sx={{ display: 'block', marginTop: '10px', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Show Map with BAs near Venue
          </Link>
        </Box>
      );
    } else if (tabIndex === 1) {
      // Open Shifts Tab Content
      return <Typography>To be implemented</Typography>;
    } else if (tabIndex === 2) {
      // Discussions Tab Content
      return <Typography>To be implemented</Typography>;
    }
  };

  if (loading) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Modal>
    );
  }

  if (!eventDetails) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          width: '80%',
          maxWidth: '1200px',
          margin: 'auto',
          marginTop: '50px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: 24,
          color: 'black',
        }}
      >
        {/* Event Header */}
        <Typography variant="h4" sx={{ color: 'gray' }}>
          Event Details
        </Typography>

        <Box
          sx={{
            backgroundColor: '#4A148C',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {/* Left Side: Event Name, Campaign, Team, and Venue Information */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {eventDetails.event_name}
            </Typography>
            <Typography sx={{ color: '#C4C4C4' }} variant="h6" > {eventDetails.campaign}</Typography>
            <Typography sx={{ fontSize: '14px' }} >
              {eventDetails.team} <br />
              {eventDetails.venueName} <br />
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventDetails.venueAddress)}`}
                target="_blank"
                sx={{ color: '#C4C4C4', textDecoration: 'underline' }}
              >
                {eventDetails.venueAddress}
              </Link>
            </Typography>
          </Box>

          {/* Right Side: Date, Time, and More Details */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography>
              Start Date & Time: {new Date(eventDetails.startDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
            </Typography>
            <Typography>
              End Time: {new Date(eventDetails.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            <Typography>
              Duration: {eventDetails.duration_hours}h {eventDetails.duration_minutes}m
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button variant="text" endIcon={<ArrowDropDownIcon />} sx={{ color: 'white' }}>
                More Details
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Tabs for Ambassadors, Open Shifts, Discussions */}
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="event tabs">
          <Tab label={`Assigned Ambassadors (${eventDetails.ambassadors.length})`} />
          <Tab label="Open Shifts" />
          <Tab label="Discussions" />
        </Tabs>

        {/* Render Content Based on Selected Tab */}
        <Box sx={{ marginTop: '20px' }}>{renderTabs()}</Box>

        {/* Action Buttons */}
        <Box sx={{ marginTop: '20px', textAlign: 'right' }}>
          <Button onClick={onClose} variant="contained" sx={{ backgroundColor: '#6c63ff' }}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EventDetailsModal;
