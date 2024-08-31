/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  paymentDetails: any[];
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({ open, onClose, paymentDetails }) => {
  const calculateTotal = (field: string) => {
    return paymentDetails.reduce((acc: number, ba: any) => acc + (ba[field] || 0), 0).toFixed(2);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper className="modal-paper">
        <h2>Payment Details</h2>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>BA Name</TableCell>
                <TableCell># Events</TableCell>
                <TableCell>Reimb</TableCell>
                <TableCell>Non Reimb</TableCell>
                <TableCell>Other Paid Time</TableCell>
                <TableCell>Demo Fee</TableCell>
                <TableCell>Event Addn/Deduct</TableCell>
                <TableCell>Payroll Addn/Deduct</TableCell>
                <TableCell>Total Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentDetails.map((ba: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{ba.baName}</TableCell>
                  <TableCell>{ba.eventCount}</TableCell>
                  <TableCell>{`$${ba.reimb.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.nonReimb.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.otherPaidTime.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.demoFee.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.eventAddDeduct.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.payrollAddDeduct.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.totalDue.toFixed(2)}`}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell>{paymentDetails.length}</TableCell>
                <TableCell>{`$${calculateTotal('reimb')}`}</TableCell>
                <TableCell>{`$${calculateTotal('nonReimb')}`}</TableCell>
                <TableCell>{`$${calculateTotal('otherPaidTime')}`}</TableCell>
                <TableCell>{`$${calculateTotal('demoFee')}`}</TableCell>
                <TableCell>{`$${calculateTotal('eventAddDeduct')}`}</TableCell>
                <TableCell>{`$${calculateTotal('payrollAddDeduct')}`}</TableCell>
                <TableCell>{`$${calculateTotal('totalDue')}`}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Modal>
  );
};

export default PaymentDetailsModal;
