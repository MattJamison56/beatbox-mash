/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Button, Menu, MenuItem, TextField } from '@mui/material';
import PayrollGroupTable from '../../../components/payrollGroupTable/payrollGroupTable';
import ExpenseSummaryModal from '../../../components/expenseSummaryModal/expenseSummaryModal';
import "./managePayrollPage.css";
const apiUrl = import.meta.env.VITE_API_URL;

const ManagePayrollPage: React.FC = () => {
  const [payrollGroups, setPayrollGroups] = useState<{ [key: string]: any[] }>({});
  const [activeTab, setActiveTab] = useState("Approved Events");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBA, setSelectedBA] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]); // State to track selected rows
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [baEvents, setBaEvents] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  const fetchPayrollGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/events/payrollgroups`);
      const data = await response.json();
      setPayrollGroups({ "Approved Events": data["Approved Events"] || [], ...data });
    } catch (error) {
      console.error('Error fetching payroll groups:', error);
    }
  };

  const fetchBAEvents = async (baId: number) => {
    try {
      const response = await fetch(`${apiUrl}/events/myeventsreimbursed/${baId}`);
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
    const selectedBaData = payrollGroups[activeTab].find(ba => ba.baId === baId);
    setSelectedBA(selectedBaData);
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

      const response = await fetch(`${apiUrl}/events/updatepayrollgroup`, {
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

  const handleExportToExcel = async () => {
    try {
      const response = await fetch(`${apiUrl}/excel/export/${activeTab}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export to Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-payroll.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const handleMarkAllAsPaid = async () => {
    try {
      const response = await fetch(`${apiUrl}/payments/markallaspaid/${activeTab}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as paid');
      }
      else {
        console.log("worked!");
      }
      
      await fetchPayrollGroups();
    } catch (error) {
      console.error('Error marking all as paid:', error);
    }
  };

  const renderTabContent = () => (
    <PayrollGroupTable
      payrollGroups={payrollGroups}
      activeTab={activeTab}
      selectedRows={selectedRows}
      handleCheckboxChange={handleCheckboxChange}
      handleBANameClick={handleBANameClick}
      handleMenuClick={handleMenuClick}
    />
  );

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Manage Payroll</h1>
        {activeTab !== "Approved Events" && (
          <div className="header-buttons">
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportToExcel}
              style={{ marginLeft: '10px' }}
            >
              Export to Excel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMarkAllAsPaid}
              style={{ marginLeft: '10px' }}
            >
              Mark All as Paid
            </Button>
          </div>
        )}
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
