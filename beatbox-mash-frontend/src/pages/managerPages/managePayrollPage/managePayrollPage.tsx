/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Menu, MenuItem } from '@mui/material';
import ExpenseSummaryModal from '../../../components/expenseSummaryModal/expenseSummaryModal';
import "./managePayrollPage.css";

const ManagePayrollPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [baEvents, setBaEvents] = useState<any[]>([]); // For storing the events for the selected BA

  const fetchApprovedEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/events/approved');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching approved events:', error);
    }
  };

  const fetchBAEvents = async (baId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/events/myeventsreimbursed/${baId}`);
      const data = await response.json();
      setBaEvents(data);
      setModalOpen(true);
    } catch (error) {
      console.error('Error fetching BA events:', error);
    }
  };

  useEffect(() => {
    fetchApprovedEvents();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, eventItem: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleBANameClick = (baId: number) => {
    fetchBAEvents(baId);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setBaEvents([]);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Manage Payroll</h1>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>BA Name</TableCell>
              <TableCell># Events</TableCell>
              <TableCell>Reimb</TableCell>
              <TableCell>Event Fee</TableCell>
              <TableCell>Total Due</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={index}>
                <TableCell
                  className="clickable"
                  onClick={() => {
                    setSelectedEvent(event); // Set the selected event including avatar URL
                    handleBANameClick(event.baId);
                  }}
                >
                  {event.baName}
                </TableCell>
                <TableCell>{event.eventCount}</TableCell>
                <TableCell>{`$${event.reimb.toFixed(2)}`}</TableCell>
                <TableCell>{`$${event.eventFee.toFixed(2)}`}</TableCell>
                <TableCell>{`$${event.totalDue.toFixed(2)}`}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={(e) => handleMenuClick(e, event)}
                  >
                    Add to Payroll
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleMenuClose}>Option 1</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Option 2</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ExpenseSummaryModal
        open={modalOpen}
        handleClose={handleModalClose}
        baName={selectedEvent?.baName}
        baAvatarUrl={selectedEvent?.baAvatarUrl}
        events={baEvents}
      />
    </div>
  );
};

export default ManagePayrollPage;
