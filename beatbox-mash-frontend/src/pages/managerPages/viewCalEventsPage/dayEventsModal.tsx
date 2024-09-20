import React from 'react';
import { IconButton, Modal, Box, Typography, List, ListItem, ListItemText, Divider } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

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
}

interface dayEventsModalProps {
  open: boolean;
  handleClose: () => void;
  events: Event[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event) => void;
  handleDeleteEvent: () => void;
}

const DayEventsModal: React.FC<dayEventsModalProps> = ({ open, handleClose, events, selectedEvent, setSelectedEvent, handleDeleteEvent }) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '80vh', width: '80vw', margin: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: 24, p: 2, color: 'black' }}>
        
        {/* Left Side - Event List */}
        <Box sx={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #ddd', paddingRight: 2 }}>
          <Typography variant="h6" sx={{ color: 'black' }}>Today's Events</Typography>
          <List>
            {events.map(event => (
              <ListItem button key={event.id} onClick={() => setSelectedEvent(event)} selected={selectedEvent && event.id === selectedEvent.id}>
                <ListItemText primary={`${event.title}`} secondary={`${event.venue}`} sx={{ color: 'black' }} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Right Side - Selected Event Details */}
        {selectedEvent ? (
          <Box sx={{ flex: 2, paddingLeft: 2, color: 'black' }}>
            <Typography variant="h6" sx={{ color: 'black' }}>{selectedEvent.title}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ color: 'black' }}><strong>Team:</strong> {selectedEvent.team}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Event Type:</strong> {selectedEvent.eventType}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Staffing:</strong> {selectedEvent.staffing}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Status:</strong> {selectedEvent.status}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Venue:</strong> {selectedEvent.venue}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Campaign:</strong> {selectedEvent.campaign}</Typography>
            <Typography sx={{ color: 'black' }}><strong>Duration:</strong> {selectedEvent.duration_hours} hrs {selectedEvent.duration_minutes} min</Typography>
            <Typography sx={{ color: 'black' }}><strong>Start:</strong> {new Date(selectedEvent.start).toLocaleString()}</Typography>
            <Typography sx={{ color: 'black' }}><strong>End:</strong> {new Date(selectedEvent.end).toLocaleString()}</Typography>

            <Box sx={{ mt: 2 }}>
              <IconButton onClick={handleDeleteEvent}>
                <DeleteIcon color="error" /> Cancel Event
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Typography sx={{ color: 'black' }}>Select an event from the list</Typography>
        )}
      </Box>
    </Modal>
  );
};

export default DayEventsModal;
