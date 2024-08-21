/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Menu, MenuItem, TextField, Checkbox } from '@mui/material';
import ExpenseSummaryModal from '../../../components/expenseSummaryModal/expenseSummaryModal';
import "./managePayrollPage.css";

const ManagePayrollPage: React.FC = () => {
  const [payrollGroups, setPayrollGroups] = useState<{ [key: string]: any[] }>({});
  const [activeTab, setActiveTab] = useState("Approved Events");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBA, setSelectedBA] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]); // State to track selected rows
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [baEvents, setBaEvents] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    if (selectedBA) {
      console.log('Selected BA:', selectedBA);
    }
  }, [selectedBA]);

  const fetchPayrollGroups = async () => {
    try {
      const response = await fetch('http://localhost:5000/events/payrollgroups');
      const data = await response.json();
      setPayrollGroups({ "Approved Events": data["Approved Events"] || [], ...data });
    } catch (error) {
      console.error('Error fetching payroll groups:', error);
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
    fetchPayrollGroups();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, ba: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedBA(ba);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBA(null);
    setNewGroupName("");
  };

  const handleBANameClick = (baId: number) => {
    fetchBAEvents(baId);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setBaEvents([]);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleCheckboxChange = (ba: any) => {
    setSelectedRows(prev => 
      prev.includes(ba)
        ? prev.filter(item => item !== ba)
        : [...prev, ba]
    );
  };

  const handleBulkMove = async (payrollGroup: string) => {
    try {
      const eventIds = selectedRows.flatMap((ba) => ba.events.map((event: any) => event.id)); // Get all event IDs associated with selected BAs
      console.log('Attempting to update payroll group:', payrollGroup, 'for event IDs:', eventIds);

      const response = await fetch('http://localhost:5000/events/updatepayrollgroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventIds, payrollGroup }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payroll group');
      }

      // Reload data after successful update
      await fetchPayrollGroups();
      setSelectedRows([]); // Clear selection after move
    } catch (error) {
      console.error('Error updating payroll group:', error);
    } finally {
      handleMenuClose();
    }
  };

  const renderTabContent = () => (
    <TableContainer component={Paper} style={{ marginTop: '20px' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell> {/* For checkboxes */}
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

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Manage Payroll</h1>
      </div>

      <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
        {Object.keys(payrollGroups).map((groupName) => (
          <Tab key={groupName} label={groupName} value={groupName} />
        ))}
      </Tabs>

      {renderTabContent()}

      {selectedRows.length > 0 ? (
          <Button
              variant="contained"
              color="secondary"
              onClick={(e) => handleMenuClick(e, selectedRows)}
              style={{ margin: '20px 0' }}
          >
              Move Selected to Payroll
          </Button>
      ) : (
          <Button
              variant="contained"
              color="secondary"
              onClick={(e) => handleMenuClick(e, selectedRows)}
              style={{ margin: '20px 0', opacity: 0.5, pointerEvents: 'none' }}
              disabled
          >
              Move Selected to Payroll
          </Button>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem>
          <TextField
            placeholder="New Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </MenuItem>
        <MenuItem onClick={() => handleBulkMove(newGroupName)}>Create and Move</MenuItem>
        {Object.keys(payrollGroups)
          .filter(group => group !== "Approved Events" && group !== activeTab)
          .map(group => (
            <MenuItem key={group} onClick={() => handleBulkMove(group)}>
              Move to {group}
            </MenuItem>
          ))}
      </Menu>

      <ExpenseSummaryModal
        open={modalOpen}
        handleClose={handleModalClose}
        baName={selectedBA?.baName}
        baAvatarUrl={selectedBA?.baAvatarUrl}
        events={baEvents}
      />
    </div>
  );
};

export default ManagePayrollPage;
