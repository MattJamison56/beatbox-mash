/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import PaymentDetailsModal from '../../../components/paymentDetailsModal/paymentDetailsModal';
import './paymentHistoryPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

const PaymentHistoryPage: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/payments/history`);
      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchPaymentDetails = async (payrollGroup: string) => {
    try {
      const response = await fetch(`${apiUrl}/payments/details/${payrollGroup}`);
      const data = await response.json();
      setSelectedPaymentDetails(data);
      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handlePayrollDateClick = (payrollGroup: string) => {
    fetchPaymentDetails(payrollGroup);
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Payment History</h1>
        <Button variant="contained" color="primary">Ungrouped Data</Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payroll Date/Time</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Total Events</TableCell>
              <TableCell>Total Reimb</TableCell>
              <TableCell>Total NonReimb</TableCell>
              <TableCell>Total Other Paid Time</TableCell>
              <TableCell>Total Addn/Deduct</TableCell>
              <TableCell>Total Demo Fee</TableCell>
              <TableCell>Total Due</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentHistory.map((payment, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span
                    className="clickable"
                    onClick={() => handlePayrollDateClick(payment.payrollGroup, payment.baId)}
                  >
                    {new Date(payment.payrollDate).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{payment.payrollName}</TableCell>
                <TableCell>{payment.comment}</TableCell>
                <TableCell>{payment.totalEvents}</TableCell>
                <TableCell>{payment.totalReimbursable}</TableCell>
                <TableCell>{payment.totalNonReimbursable}</TableCell>
                <TableCell>{payment.totalOtherPaidTime}</TableCell>
                <TableCell>{payment.totalAddDeduct}</TableCell>
                <TableCell>{payment.totalDemoFee}</TableCell>
                <TableCell>{payment.totalDue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for Payment Details */}
      {selectedPaymentDetails && (
        <PaymentDetailsModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          paymentDetails={selectedPaymentDetails}
        />
      )}
    </div>
  );
};

export default PaymentHistoryPage;
