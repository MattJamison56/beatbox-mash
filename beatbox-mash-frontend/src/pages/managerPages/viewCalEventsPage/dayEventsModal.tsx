import React from 'react';
import { IconButton, Modal, Box, Typography, List, ListItemText, ListItemButton, Avatar, Button } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

interface Ambassador {
  id: number;
  name: string;
  avatar_url: string;
  status: string;
}

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
  pendingAmbassadorsCount: number;
  acceptedAmbassadorsCount: number;
  ambassadors: Ambassador[]; // Array of ambassador details
}

// Function to get the left border color based on event status or counts
const getBorderColor = (event: Event) => {
  if (event.acceptedAmbassadorsCount > 0) {
    return "#32CD32"; // Green for accepted
  } else if (event.pendingAmbassadorsCount > 0) {
    return "#FFA500"; // Orange for pending
  } else {
    return "#FF6347"; // Red for declined or no ambassadors
  }
};

interface DayEventsModalProps {
  open: boolean;
  handleClose: () => void;
  events: Event[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event) => void;
  handleDeleteEvent: () => void;
}

const DayEventsModal: React.FC<DayEventsModalProps> = ({ open, handleClose, events, selectedEvent, setSelectedEvent, handleDeleteEvent }) => {
  // Log for selectedEvent
  console.log('Selected Event:', selectedEvent);

  // Check if selectedEvent is null or undefined
  if (!selectedEvent) {
    console.log('No selected event found.');
    return null;
  }

  // Log the ambassadors array
  console.log('Ambassadors for selected event:', selectedEvent.ambassadors);

  const formatDateTime = (start: Date, end: Date) => {
    const startTime = new Date(start).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    const endTime = new Date(end).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    return `${startTime} — ${endTime}`;
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          height: '80vh',
          width: '90%', // Default width is 90%
          maxWidth: '1200px', // Maximum width is 1200px
          margin: 'auto',
          marginTop: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: 24,
          p: 2,
          color: 'black',
        }}
      >
        {/* Left Side - Event List */}
        <Box sx={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #ddd', paddingRight: 2 }}>
          <Typography variant="h6" sx={{ color: 'black' }}>Today's Events</Typography>
          <List>
            {events.map(event => (
              <ListItemButton
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                selected={selectedEvent && event.id === selectedEvent.id}
                sx={{
                  // Thicker left border based on status
                  borderLeft: `8px solid ${getBorderColor(event)}`,
                  // Full border only if the item is selected
                  borderTop: selectedEvent && event.id === selectedEvent.id ? `2px solid ${getBorderColor(event)}` : '',
                  borderBottom: selectedEvent && event.id === selectedEvent.id ? `2px solid ${getBorderColor(event)}` : '',
                  borderRight: selectedEvent && event.id === selectedEvent.id ? `2px solid ${getBorderColor(event)}` : '',
                  borderRadius: '5px',
                  marginBottom: '5px', // Spacing between list items
                  paddingLeft: '16px', // Padding to offset the thicker left border
                  backgroundColor: 'transparent', // Prevent background change when selected
                  '&.Mui-selected': {
                    backgroundColor: 'transparent', // Ensure background stays transparent when selected
                    '&:hover': {
                      backgroundColor: 'transparent', // Ensure no background change on hover when selected
                    },
                  },
                }}
              >
                <ListItemText primary={`${event.title}`} secondary={`${event.venue}`} sx={{ color: 'black' }} />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Right Side - Selected Event Details */}
        {selectedEvent && (
          <Box sx={{ flex: 2, paddingLeft: 2, color: 'black' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black' }}>
              {selectedEvent.title}
            </Typography>
            <Typography sx={{ color: getBorderColor(selectedEvent), fontWeight: 'bold', my: 2 }}>
              {selectedEvent.status}
            </Typography>
            <Typography sx={{ color: 'black' }}>
              {formatDateTime(selectedEvent.start, selectedEvent.end)}
            </Typography>
            <Typography sx={{ color: 'black' }}>
              {selectedEvent.venue}
            </Typography>
            <Typography sx={{ color: 'purple', textDecoration: 'underline', mb: 2 }}>
              2400 Biltmore Estates Dr, Phoenix, AZ 85016 {/* Replace with real address */}
            </Typography>

            {/* Log here before mapping ambassadors */}
            <Typography>Checking Ambassadors:</Typography>
            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
              {selectedEvent.ambassadors && selectedEvent.ambassadors.length > 0 ? (
                selectedEvent.ambassadors.map(ambassador => (
                  <Box
                    key={ambassador.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                  >
                    <Avatar alt={ambassador.name} src={ambassador.avatar_url} sx={{ width: 40, height: 40, marginRight: 2 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'black' }}>
                        {ambassador.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'orange' }}>
                        {ambassador.status} {/* Example: 'Pending Approval' */}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography>No ambassadors available</Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button variant="contained" sx={{ backgroundColor: '#6c63ff' }} onClick={() => alert('View Details clicked')}>
                View Details
              </Button>
              <IconButton onClick={handleDeleteEvent}>
                <DeleteIcon color="error" /> Cancel Event
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default DayEventsModal;
