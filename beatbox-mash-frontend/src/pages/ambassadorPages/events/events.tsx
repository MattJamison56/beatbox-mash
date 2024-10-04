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
import Webcam from 'react-webcam';
import { format } from 'date-fns';

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
  ambassadorStatus: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // For viewing reports
  const [webcamOpen, setWebcamOpen] = useState<boolean>(false); // For capturing photos
  const [currentAction, setCurrentAction] = useState<'checkin' | 'checkout' | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null); // Base64 image string
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
      console.log('Data received:', data);

      // Filter out declined events
      const filteredData = data.filter((event: Event) => event.ambassadorStatus !== 'declined');

      setEvents(filteredData);
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
    setPdfUrl(null);
  };

  const handleReportSubmitted = () => {
    fetchEvents();
  };

  const handleViewReport = async (event: Event) => {
    try {
      console.log(`Fetching PDF for event ID: ${event.id}`);
      const response = await fetch(`${apiUrl}/pdf/getpdf/${event.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.pdfUrl) {
        console.log('PDF URL received:', data.pdfUrl);
        setPdfUrl(data.pdfUrl);
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

  const handleAcceptEvent = async (event: Event) => {
    try {
      const response = await fetch(`${apiUrl}/events/accept/${event.id}`, {
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
        alert('Event accepted.');
      } else {
        console.error('Error accepting event:', response.statusText);
      }
    } catch (error) {
      console.error('Error accepting event:', error);
    }
  };

  const canCheckIn = (startDateTime: string): boolean => {
    const startTime = new Date(startDateTime);
    const now = new Date();
    const diffInMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    return Math.abs(diffInMinutes) <= 15;
  };

  const eventHasStarted = (startDateTime: string): boolean => {
    const startTime = new Date(startDateTime);
    const now = new Date();
    return now >= startTime;
  };

  const handleCheckIn = (event: Event) => {
    setSelectedEvent(event);
    setCurrentAction('checkin');
    setWebcamOpen(true);
  };

  const handleCheckOut = (event: Event) => {
    setSelectedEvent(event);
    setCurrentAction('checkout');
    setWebcamOpen(true);
  };

  const handleCapturePhoto = (photoData: string) => {
    setCapturedPhoto(photoData);
    setWebcamOpen(false);
    if (currentAction === 'checkin') {
      uploadCheckInOutPhoto(selectedEvent!, 'checkin', photoData);
    } else if (currentAction === 'checkout') {
      uploadCheckInOutPhoto(selectedEvent!, 'checkout', photoData);
    }
  };

  const uploadCheckInOutPhoto = async (event: Event, action: 'checkin' | 'checkout', photoData: string) => {
    try {
      const ba_id = localStorage.getItem('ba_id');
      if (!ba_id) {
        console.error('No ba_id found in local storage');
        return;
      }

      // Convert base64 image to File object
      const blob = await (await fetch(photoData)).blob();
      const file = new File([blob], `${action}_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`, {
        type: 'image/jpeg',
      });

      // Get current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Create FormData
          const formData = new FormData();
          formData.append('eventId', event.id.toString());
          formData.append('ba_id', ba_id);
          formData.append('latitude', latitude.toString());
          formData.append('longitude', longitude.toString());
          formData.append('photo', file);

          const endpoint = `${apiUrl}/events/${action}`;

          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            alert(`${action === 'checkin' ? 'Check-in' : 'Check-out'} successful`);
            fetchEvents(); // Refresh events to update status
          } else {
            const data = await response.json();
            alert(`${action === 'checkin' ? 'Check-in' : 'Check-out'} failed: ${data.message}`);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } catch (error) {
      console.error(`Error during ${action}:`, error);
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
                        onClick={() => handleViewReport(event)}
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
                      {console.log('Ambassador Status:', event.ambassadorStatus)}
                      <Grid item xs={12}>
                        <Typography variant="body2">Venue: {event.venue}</Typography>
                        <Typography variant="body2">Team: {event.team}</Typography>
                        <Typography variant="body2">Inventory: {event.inventory ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">QA: {event.qa ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">Photos: {event.photos ? 'Yes' : 'No'}</Typography>
                        <Typography variant="body2">Expenses: {event.expenses ? 'Yes' : 'No'}</Typography>
                      </Grid>
                      <Grid item xs={12} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {event.ambassadorStatus === 'accepted' ? (
                          <>
                            {!event.hasCheckedIn && canCheckIn(event.startDateTime) && (
                              <Button variant="contained" color="primary" onClick={() => handleCheckIn(event)}>
                                Check In
                              </Button>
                            )}
                            {event.hasCheckedIn && !event.hasCheckedOut && eventHasStarted(event.startDateTime) && (
                              <Button variant="contained" color="primary" onClick={() => handleCheckOut(event)}>
                                Check Out
                              </Button>
                            )}
                            {/* "Fill Out Report" or "Edit Report" button */}
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                if (event.personal_report_submitted) {
                                  alert('To be implemented');
                                } else {
                                  handleOpenModal(event);
                                }
                              }}
                            >
                              {event.personal_report_submitted ? 'Edit Report' : 'Fill Out Report'}
                            </Button>
                          </>
                        ) : event.ambassadorStatus === 'pending' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              style={{ marginBottom: '8px' }}
                              onClick={() => handleAcceptEvent(event)}
                            >
                              Accept
                            </Button>
                            <Tooltip
                              title={
                                isEventWithinOneWeek(event.startDateTime)
                                  ? 'Event within one week. Please reach out to manager if something has come up.'
                                  : ''
                              }
                            >
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
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            You have declined this event.
                          </Typography>
                        )}
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

      {/* PDF Viewer Modal */}
      <Modal open={openModal2} onClose={handleCloseModal2}>
        <Box
          onClick={handleCloseModal2}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
        >
          <div
            className="modalContent"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            {pdfUrl ? (
              <>
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.js">
                  <div style={{ height: '80vh', width: '900px', overflow: 'hidden' }}>
                    <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
                  </div>
                </Worker>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </Box>
      </Modal>

      {/* Webcam Modal for Photo Capture */}
      <Modal open={webcamOpen} onClose={() => setWebcamOpen(false)}>
        <Box
          onClick={() => setWebcamOpen(false)}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
        >
          <div
            className="modalContent"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {capturedPhoto ? (
              <>
                <img src={capturedPhoto} alt="Captured" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
                <Button variant="contained" color="primary" onClick={() => handleCapturePhoto(capturedPhoto)}>
                  Confirm
                </Button>
              </>
            ) : (
              <WebcamCapture onCapture={handleCapturePhoto} />
            )}
          </div>
        </Box>
      </Modal>
    </Box>
  );
};

// WebcamCapture Component
interface WebcamCaptureProps {
  onCapture: (photoData: string) => void;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture }) => {
  const webcamRef = React.useRef<Webcam>(null);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={400}
        height={300}
        videoConstraints={{ facingMode: 'environment' }}
      />
      <Button variant="contained" color="primary" onClick={capture}>
        Capture Photo
      </Button>
    </div>
  );
};

export default Events;
