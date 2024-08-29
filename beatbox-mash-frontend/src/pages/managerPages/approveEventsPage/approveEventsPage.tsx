/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, IconButton, Menu, MenuItem, Modal, Box, Button, TextField } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import "./approveEventsPage.css";
const apiUrl = import.meta.env.VITE_API_URL;

const ApproveEventsPage: React.FC = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [events, setEvents] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<null | any>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>(''); // State for the message

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${apiUrl}/events/pendingreports`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchPdf = async (eventId: number) => {
    try {
      const response = await fetch(`${apiUrl}/pdf/getpdf/${eventId}`);
      const data = await response.json();
      setPdfUrl(data.pdfUrl);
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching PDF:', error);
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

  const handleApprove = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      console.error('No event selected or invalid event ID');
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/events/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedEvent.id, message }), // Include message in the request
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleMenuClose();
      handleCloseModal();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };
  
  const handleReject = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      console.error('No event selected or invalid event ID');
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/events/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedEvent.id, message }), // Include message in the request
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleMenuClose();
      handleCloseModal();
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };
  
  const handleEventNameClick = (event: any) => {
    setSelectedEvent(event);
    fetchPdf(event.id)
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setPdfUrl(null);
    setMessage(''); // Clear the message when modal closes
  };

  return (
    <Box padding={2}>
      <div className="header">
        <h1 className="title">Approve Submitted Events</h1>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Name</TableCell>
              <TableCell>Campaigns</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>BA Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Report Date</TableCell>
              <TableCell>Total Expense</TableCell>
              <TableCell># of Expenses</TableCell>
              <TableCell># of Photos</TableCell>
              <TableCell>Total Due</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span
                    className="clickable"
                    onClick={() => handleEventNameClick(event)}
                  >
                    {event.eventName}
                  </span>
                </TableCell>
                <TableCell>{event.campaigns}</TableCell>
                <TableCell>{event.region}</TableCell>
                <TableCell>{event.team}</TableCell>
                <TableCell>
                  <Avatar alt={event.baName} src={event.baAvatarUrl} />
                  {event.baName}
                </TableCell>
                <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(event.reportDate).toLocaleDateString()}</TableCell>
                <TableCell>{`$${event.totalExpense.toFixed(2)}`}</TableCell>
                <TableCell>{event.expensesCount}</TableCell>
                <TableCell>{event.photosCount}</TableCell>
                <TableCell>{`$${event.totalDue.toFixed(2)}`}</TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, event)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleApprove}>Approve</MenuItem>
                    <MenuItem onClick={handleReject}>Reject</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box 
          onClick={handleCloseModal}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
        >
          <div 
            className="modalContent" 
            style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} 
            onClick={(e) => e.stopPropagation()} 
          >
            {pdfUrl ? (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.15.349/build/pdf.worker.js">
                <div style={{ height: '80vh', width: '900px', overflow: 'hidden' }}>
                    <Viewer
                        fileUrl={pdfUrl}
                        plugins={[defaultLayoutPluginInstance]}
                    />
                </div>
              </Worker>
            ) : (
              <p>Loading...</p>
            )}
            <TextField
              label="Message (optional)"
              multiline
              rows={4}
              variant="outlined"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ marginTop: '20px', maxWidth: '900px' }}
            />
            <Box style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Button variant="contained" color="primary" onClick={handleApprove} style={{ margin: '0 10px' }}>
                Approve
              </Button>
              <Button variant="contained" color="secondary" onClick={handleReject} style={{ margin: '0 10px' }}>
                Reject
              </Button>
            </Box>
          </div>
        </Box>
      </Modal>
    </Box>
  );
};

export default ApproveEventsPage;
