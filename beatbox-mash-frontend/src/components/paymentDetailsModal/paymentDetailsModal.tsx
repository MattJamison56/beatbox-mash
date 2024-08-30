/* eslint-disable @typescript-eslint/no-explicit-any */
// PaymentDetailsModal.tsx
import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import './paymentDetailsModal.css';

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  paymentDetails: any;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ open, onClose, paymentDetails }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box className="modalContent" sx={{ padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        {paymentDetails ? (
          <div>
            <Typography variant="body1"><strong>Name:</strong> {paymentDetails.name}</Typography>
            <Typography variant="body1"><strong>Comment:</strong> {paymentDetails.comment}</Typography>
            <Typography variant="body1"><strong>Total Events:</strong> {paymentDetails.totalEvents}</Typography>
            <Typography variant="body1"><strong>Total Reimbursable:</strong> {paymentDetails.totalReimbursable}</Typography>
            <Typography variant="body1"><strong>Total Non-Reimbursable:</strong> {paymentDetails.totalNonReimbursable}</Typography>
            <Typography variant="body1"><strong>Total Other Paid Time:</strong> {paymentDetails.totalOtherPaidTime}</Typography>
            <Typography variant="body1"><strong>Total Additional/Deductions:</strong> {paymentDetails.totalAddDeduct}</Typography>
            <Typography variant="body1"><strong>Total Demo Fee:</strong> {paymentDetails.totalDemoFee}</Typography>
            <Typography variant="body1"><strong>Total Due:</strong> {paymentDetails.totalDue}</Typography>
          </div>
        ) : (
          <Typography variant="body2">Loading...</Typography>
        )}
        <Button variant="contained" color="primary" onClick={onClose} style={{ marginTop: '20px' }}>
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default PaymentDetailsModal;
