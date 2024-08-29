/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, List, Divider, Button, Card, CardContent, Grid, IconButton, Tooltip, Modal,
  styled
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import ReportForm from '../../../components/reportForm/reportForm';
const apiUrl = import.meta.env.VITE_API_URL;

interface Event {
  report_submitted: any;
  personal_report_submitted: boolean;
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

const isEventWithinOneWeek = (startDateTime: string) => {
  const startDate = new Date(startDateTime);
  const now = new Date();
  const diffInDays = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays < 7;
};

interface ReportStatusProps {
  status: 'overdue' | 'required' | 'submitted';
}

const ReportStatus = styled('div')<ReportStatusProps>(({ status }) => ({
  borderRadius: '16px',
  padding: '4px 8px',
  color: '#fff',
  backgroundColor: status === 'overdue' ? 'red' : status === 'submitted' ? 'green' : 'orange',
  border: `1px solid ${status === 'overdue' ? 'red' : status === 'submitted' ? 'green' : 'orange'}`,
  display: 'inline-block',
  textAlign: 'center',
  minWidth: '50px',
}));

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEventIds, setExpandedEventIds] = useState<number[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModal2, setOpenModal2] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Add PDF URL state
  const defaultLayoutPluginInstance = defaultLayoutPlugin(); // Initialize PDF plugin

  const fetchEvents = async () => {
    const ba_id = localStorage.getItem('ba_id');
    if (!ba_id) {
      console.error('No ba_id found in local storage');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/events/myevents/${ba_id}`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
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

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCloseModal2 = () => {
    setOpenModal2(false);
    setPdfUrl(null); // Clear the PDF URL when modal closes
  };


  const handleReportSubmitted = () => {
    fetchEvents();
  };

  const handleViewReport = async (event: Event) => {
    try {
      console.log(`Fetching PDF for event ID: ${event.id}`); // Log the event ID
      const response = await fetch(`${apiUrl}/pdf/getpdf/${event.id}`);
      console.log('Response status:', response.status); // Log the status of the response
  
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
  
      const data = await response.json();
      console.log('Response data:', data); // Log the response data
  
      if (data.pdfUrl) {
        console.log('PDF URL received:', data.pdfUrl); // Log the received PDF URL
        setPdfUrl(data.pdfUrl); // Set PDF URL for viewing in modal
        setOpenModal2(true);
      } else {
        console.error('No PDF URL found in response data');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };
  

  const handleDeclineEvent = async (event: Event) => {
    try {
      const response = await fetch(`${apiUrl}/events/decline/${event.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ba_id: localStorage.getItem('ba_id'),
        }),
      });
      if (response.ok) {
        fetchEvents();
        alert('Event declined and email sent to campaign owner(s).');
      } else {
        console.error('Error declining event:', response.statusText);
      }
    } catch (error) {
      console.error('Error declining event:', error);
    }
  };

  return (
    <Box padding={2}>
      <h1 style={{ color: 'black' }}>My Events</h1>
      <List>
        {events.map((event) => (
          <React.Fragment key={event.id}>
            <Card variant="outlined" style={{ marginBottom: '16px' }}>
              <CardContent>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={2}>
                    {event.personal_report_submitted ? (
                      <ReportStatus status="submitted">Submitted</ReportStatus>
                    ) : isReportOverdue(event.endDateTime) ? (
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
                    <Typography variant="body2">{event.eventName}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">{event.campaign}</Typography>
                  </Grid>
                  <Grid item xs={1.6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {event.report_submitted ? (
                        <Button
                          variant="contained"
                          color="primary"
                          style={{ marginRight: '8px' }}
                          onClick={() => handleViewReport(event)} // Updated functionality
                        >
                          View Report
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          style={{ marginRight: '8px' }}
                          onClick={() => handleOpenModal(event)}
                        >
                          Details
                        </Button>
                      )}
                  </Grid>
                  <Grid item xs={0.4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => toggleExpand(event.id)}>
                      {expandedEventIds.includes(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Grid>
                  {expandedEventIds.includes(event.id) && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2">Venue: {event.venue}</Typography>
                        <Typography variant="body2">Team: {event.team}</Typography>
                        <Typography variant="body2">Inventory: {event.inventory ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">QA: {event.qa ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">Photos: {event.photos ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">Expenses: {event.expenses ? 'Yes' : 'No'}</Typography>
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
                          <Tooltip title={isEventWithinOneWeek(event.startDateTime) ? "Event within one week. Please reach out to manager if something has come up." : ""}>
                            <span>
                              <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => handleDeclineEvent(event)}
                                disabled={isEventWithinOneWeek(event.startDateTime)}
                              >
                                Decline
                              </Button>
                            </span>
                          </Tooltip>
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
          eventId={selectedEvent.id}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
      <Modal open={openModal2} onClose={handleCloseModal2}>
        <Box 
          onClick={handleCloseModal2}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}  // Centering the content
        >
          <div 
            className="modalContent" 
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}  // Styling the modal content
          >
            {pdfUrl ? (
              <>
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">
                  <div style={{ height: '80vh', width: '900px', overflow: 'hidden' }}>
                    <Viewer
                      fileUrl={pdfUrl}
                      plugins={[defaultLayoutPluginInstance]}
                    />
                  </div>
                </Worker>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </Box>
      </Modal>
    </Box>
  );
};

export default Events;
