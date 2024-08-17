/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, IconButton, Menu, MenuItem, Modal, Box } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import "./approveEventsPage.css"

const ApproveEventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<null | any>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/events/pendingreports');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchPdf = async (eventId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/pdf/getpdf/${eventId}`);
      const data = await response.json();
      console.log(data);
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
    try {
      const response = await fetch(`http://localhost:5000/events/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedEvent.id }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/events/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedEvent.id }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  const handleEventNameClick = (eventId: number) => {
    console.log("Fetched:" + eventId);
    fetchPdf(eventId);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setPdfUrl(null);
  };

  return (
    <div className="container">
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
                    onClick={() => handleEventNameClick(event.id)}
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
        <Box className="modalStyle">
          {pdfUrl ? (
            <iframe src={pdfUrl} width="100%" height="1100px" title="Event Report"></iframe>
          ) : (
            <p>Loading...</p>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default ApproveEventsPage;
