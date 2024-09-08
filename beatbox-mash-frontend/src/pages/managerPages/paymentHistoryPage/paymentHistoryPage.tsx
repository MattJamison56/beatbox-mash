/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import './paymentHistoryPage.css';

const apiUrl = import.meta.env.VITE_API_URL;

const PaymentHistoryPage: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<any | null>(null);
  const [viewingDetails, setViewingDetails] = useState<boolean>(false); // Toggle between views
  const [payrollGroupName, setPayrollGroupName] = useState<string | null>(null); // Store payroll group name for header

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
      const response = await fetch(`${apiUrl}/payments/details/${payrollGroup}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }

      const data = await response.json();
      setSelectedPaymentDetails(data);
      setPayrollGroupName(payrollGroup); // Set the group name for the header
      setViewingDetails(true); // Switch to details view
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handlePayrollDateClick = (payrollGroup: string) => {
    fetchPaymentDetails(payrollGroup);
  };

  const handleBackToList = () => {
    setViewingDetails(false); // Switch back to payment history
    setSelectedPaymentDetails(null); // Clear the details
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">
          {viewingDetails ? `Payment History - ${payrollGroupName}` : 'Payment History'}
        </h1>
        {viewingDetails && (
          <Button variant="contained" color="primary" onClick={handleBackToList}>
            &lt;- Back to List
          </Button>
        )}
      </div>

      {viewingDetails ? (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>BA Name</TableCell>
                <TableCell># Events</TableCell>
                <TableCell>Reimb</TableCell>
                <TableCell>Non Reimb</TableCell>
                <TableCell>Other Paid Time</TableCell>
                <TableCell>Demo Fee</TableCell>
                <TableCell>Total Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedPaymentDetails.map((ba: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{ba.baName}</TableCell>
                  <TableCell>{ba.eventCount}</TableCell>
                  <TableCell>{`$${ba.reimb.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.nonReimb.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.otherPaidTime.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.demoFee.toFixed(2)}`}</TableCell>
                  <TableCell>{`$${ba.totalDue.toFixed(2)}`}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell>{selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.eventCount, 0)}</TableCell>
                <TableCell>{`$${selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.reimb, 0).toFixed(2)}`}</TableCell>
                <TableCell>{`$${selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.nonReimb, 0).toFixed(2)}`}</TableCell>
                <TableCell>{`$${selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.otherPaidTime, 0).toFixed(2)}`}</TableCell>
                <TableCell>{`$${selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.demoFee, 0).toFixed(2)}`}</TableCell>
                <TableCell>{`$${selectedPaymentDetails.reduce((acc: number, ba: any) => acc + ba.totalDue, 0).toFixed(2)}`}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
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
                      onClick={() => handlePayrollDateClick(payment.payrollName)}
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
      )}
    </div>
  );
};

export default PaymentHistoryPage;
