/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button, Avatar } from '@mui/material';

interface PayrollGroupTableProps {
  payrollGroups: { [key: string]: any[] };
  activeTab: string;
  selectedRows: any[];
  handleCheckboxChange: (ba: any) => void;
  handleBANameClick: (baId: number) => void;
  handleMenuClick: (event: React.MouseEvent<HTMLButtonElement>, ba: any) => void;
}

const PayrollGroupTable: React.FC<PayrollGroupTableProps> = ({
  payrollGroups,
  activeTab,
  selectedRows,
  handleCheckboxChange,
  handleBANameClick,
  handleMenuClick
}) => {
  return (
    <TableContainer component={Paper} style={{ marginTop: '20px' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>BA Name</TableCell>
            <TableCell># Events</TableCell>
            <TableCell>Reimb</TableCell>
            <TableCell>Event Fee</TableCell>
            <TableCell>Total Due</TableCell>
            <TableCell>Options</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payrollGroups[activeTab]?.map((ba, index) => (
            <TableRow key={index}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.includes(ba)}
                  onChange={() => handleCheckboxChange(ba)}
                />
              </TableCell>
              <TableCell
                className="clickable"
                onClick={() => handleBANameClick(ba.baId)}
              >
                <Avatar src={ba.baAvatarUrl} />
                {ba.baName}
              </TableCell>
              <TableCell>{ba.eventCount}</TableCell>
              <TableCell>{`$${ba.reimb.toFixed(2)}`}</TableCell>
              <TableCell>{`$${ba.eventFee.toFixed(2)}`}</TableCell>
              <TableCell>{`$${ba.totalDue.toFixed(2)}`}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => handleMenuClick(e, ba)}
                >
                  Add to Payroll
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Total</TableCell>
            <TableCell>{payrollGroups[activeTab]?.length}</TableCell>
            <TableCell>{`$${payrollGroups[activeTab]?.reduce((acc, ba) => acc + ba.reimb, 0).toFixed(2)}`}</TableCell>
            <TableCell>{`$${payrollGroups[activeTab]?.reduce((acc, ba) => acc + ba.eventFee, 0).toFixed(2)}`}</TableCell>
            <TableCell>{`$${payrollGroups[activeTab]?.reduce((acc, ba) => acc + ba.totalDue, 0).toFixed(2)}`}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </TableContainer>
  );
};

export default PayrollGroupTable;
