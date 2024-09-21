import React, { useState } from 'react';
import { Modal, Box, Typography, List, ListItemText, ListItemButton, Avatar, Button } from "@mui/material";
import EventDetailsModal from '../../../components/eventDetailsModal/eventDetailsModal';

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
  venueAddress: string; // Add venueAddress here
  campaign: string;
  duration_hours: number;
  duration_minutes: number;
  pendingAmbassadorsCount: number;
  acceptedAmbassadorsCount: number;
  declinedAmbassadorsCount: number;
  ambassadors: string | Ambassador[];
  paid: boolean;
  eventStatus: string;
  totalAmbassadorsCount: number;
}

// Helper function to capitalize the first letter of a word
const capitalizeFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

interface DayEventsModalProps {
  open: boolean;
  handleClose: () => void;
  events: Event[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event) => void;
  handleDeleteEvent: () => void;
}

// Function to get the left border color based on event status or counts
const getBorderColor = (event: Event) => {
  if (event.eventStatus === 'Upcoming') {
    if (event.acceptedAmbassadorsCount === event.totalAmbassadorsCount && event.totalAmbassadorsCount > 0) {
      return "#32CD32"; // Green
    } else if (
      event.acceptedAmbassadorsCount === 0 &&
      (event.declinedAmbassadorsCount + event.pendingAmbassadorsCount === event.totalAmbassadorsCount)
    ) {
      return "#FF6347"; // Red
    } else if (event.declinedAmbassadorsCount > 0 || event.pendingAmbassadorsCount > 0) {
      return "#FFA500"; // Orange
    } else {
      return "#3174ad"; // Default color
    }
  } else if (event.eventStatus === 'Completed') {
    if (event.paid) {
      return "#32CD32"; // Green
    } else {
      return "#FFA500"; // Orange
    }
  } else {
    return "#3174ad"; // Default color
  }
};


// Function to return the color based on status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return '#32CD32'; // Green
    case 'pending':
      return '#FFA500'; // Orange
    case 'declined':
      return '#FF6347'; // Red
    case 'payment sent':
      return '#32CD32'; // Green
    case 'payment due':
      return '#FFA500'; // Orange
    default:
      return 'black';
  }
};

const DayEventsModal: React.FC<DayEventsModalProps> = ({ open, handleClose, events, selectedEvent, setSelectedEvent, handleDeleteEvent }) => {
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false); // State to manage EventDetailsModal open/close
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null); // Store the event ID for EventDetailsModal

  if (!selectedEvent) return null;

  // Function to open the EventDetailsModal
  const handleViewDetails = (eventId: number) => {
    setSelectedEventId(eventId);
    setIsEventDetailsOpen(true);
  };

  // Function to close the EventDetailsModal
  const handleCloseEventDetails = () => {
    setIsEventDetailsOpen(false);
    setSelectedEventId(null);
  };

  // Parse ambassadors if they are in string form
  let ambassadorsArray: Ambassador[] = [];
  if (typeof selectedEvent.ambassadors === 'string') {
    try {
      ambassadorsArray = JSON.parse(selectedEvent.ambassadors); // Parse the stringified JSON
    } catch (error) {
      console.error('Error parsing ambassadors:', error);
    }
  } else {
    ambassadorsArray = selectedEvent.ambassadors; // Use as-is if already an array
  }

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
    <>
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
                {selectedEvent.venueAddress} {/* Use real address from backend */}
              </Typography>

              {/* Log here before mapping ambassadors */}
              <Typography>Ambassadors List:</Typography>
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                {ambassadorsArray && ambassadorsArray.length > 0 ? (
                  ambassadorsArray.map(ambassador => {
                    let displayedStatus = '';
                    let statusColor = '';

                    if (selectedEvent.eventStatus === 'Completed') {
                      if (selectedEvent.paid) {
                        displayedStatus = 'Payment Sent';
                        statusColor = getStatusColor(displayedStatus);
                      } else {
                        displayedStatus = 'Payment Due';
                        statusColor = getStatusColor(displayedStatus);
                      }
                    } else {
                      displayedStatus = capitalizeFirstLetter(ambassador.status);
                      statusColor = getStatusColor(ambassador.status);
                    }

                    return (
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
                          <Typography variant="body2" sx={{ color: statusColor }}>
                            {displayedStatus}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                ) : (
                  <Typography>No ambassadors available</Typography>
                )}
              </Box>


              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: '#6c63ff' }}
                  onClick={() => handleViewDetails(selectedEvent.id)}
                >
                  View Details
                </Button>
                <Button onClick={handleDeleteEvent} sx={{color: '#FF6347', textDecoration: 'underline'}}>
                  Cancel Event
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>

      {/* Event Details Modal */}
      {selectedEventId && (
        <EventDetailsModal
          open={isEventDetailsOpen}
          onClose={handleCloseEventDetails}
          eventId={selectedEventId}
        />
      )}
    </>
  );
};

export default DayEventsModal;
