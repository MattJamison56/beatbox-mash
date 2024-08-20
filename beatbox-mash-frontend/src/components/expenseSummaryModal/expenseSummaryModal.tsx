/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Modal, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar } from '@mui/material';
import "./expenseSummaryModal.css";

interface ExpenseSummaryModalProps {
  open: boolean;
  handleClose: () => void;
  baName: string;
  baAvatarUrl: string;
  events: any[];
}

const ExpenseSummaryModal: React.FC<ExpenseSummaryModalProps> = ({ open, handleClose, baName, baAvatarUrl, events }) => {

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box className="modalStyle">
        <Typography variant="h6" className="modalTitle">Expense Summary</Typography>
        
        <Box className="baInfo">
          <Avatar alt={baName} src={baAvatarUrl} className="baAvatar" />
          <Typography variant="subtitle1" className="baName">{baName}</Typography>
        </Box>

        {events.map((event, index) => {
          const { hours, minutes } = calculateDuration(event.startDateTime, event.endDateTime);
          
          return (
            <Box key={index} className="eventDetail">
              <Typography variant="subtitle2" className="eventName">
                {event.eventName}
              </Typography>
              <Typography variant="body2" className="eventTime">
              {new Date(event.startDateTime).toLocaleDateString()}  {new Date(event.startDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(event.endDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ({hours} hrs {minutes} min)
              </Typography>
              <TableContainer component={Paper} className="eventTable">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reimb</TableCell>
                      <TableCell>Event Fee</TableCell>
                      <TableCell>Total Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{`$${event.reimbursedAmount.toFixed(2)}`}</TableCell>
                      <TableCell>{`$${event.eventFee.toFixed(2)}`}</TableCell>
                      <TableCell>{`$${event.totalDue.toFixed(2)}`}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })}

        <Box className="modalActions">
          <Button variant="contained" color="primary" onClick={handleClose} style={{ margin: '10px' }}>
            Add All to Payroll
          </Button>
          <Button variant="contained" color="secondary" onClick={handleClose} style={{ margin: '10px' }}>
            Reject All
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExpenseSummaryModal;
