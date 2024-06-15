import React, { useState, MouseEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import logo from '../../assets/beatboxlogo.png';
import './navbar.css';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Button } from '@mui/material';

const Navbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [submenu, setSubmenu] = useState<string | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setSubmenu(event.currentTarget.getAttribute('data-submenu'));
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSubmenu(null);
  };

  return (
    <div>
      <AppBar position="fixed" style={{ backgroundColor: '#5a50a0', zIndex: 1201, padding: '8px' }}>
        <Toolbar>
          <img src={logo} alt="Logo" className='logo' />
          <Button className="navButton" color="inherit" data-submenu="planEvents" onClick={handleClick}>Plan Events</Button>
          <Button className="navButton" color="inherit" data-submenu="approvePay" onClick={handleClick}>Approve & Pay</Button>
          <Button className="navButton" color="inherit" data-submenu="reportAnalyze" onClick={handleClick}>Report & Analyze</Button>
          <Button className="navButton" color="inherit" data-submenu="setUp" onClick={handleClick}>Set Up</Button>
          <Button className="navButton" color="inherit" data-submenu="admin" onClick={handleClick}>Admin</Button>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This is to offset the content below the AppBar */}
      <Drawer
        anchor="top"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{ style: { width: 'auto', top: 64, position: 'absolute', zIndex: 1200 } }}
      >
        <Box p={3} display="flex" justifyContent="flex-start" flexWrap="wrap" marginTop='20px' marginLeft='20px' marginBottom='20px'>
          {submenu === 'planEvents' && (
            <>
              <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                  <EventNoteIcon sx={{ marginRight: '8px' }} />
                  View Events
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>List View</button>
                <button className="subcat" style={{ width: '100%' }}>Calendar View</button>
                <button className="subcat" style={{ width: '100%' }}>Map View</button>
                <button className="subcat" style={{ width: '100%' }}>Check In Status</button>
              </Box>
              <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                  <CalendarTodayIcon sx={{ marginRight: '8px' }} />
                  Create Single Event
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>By Date or Range</button>
                <button className="subcat" style={{ width: '100%' }}>By Calendar</button>
                <button className="subcat" style={{ width: '100%' }}>By Map by Venue</button>
                <button className="subcat" style={{ width: '100%' }}>By Map by BA</button>
                <button className="subcat" style={{ width: '100%' }}>By Multi Shift</button>
              </Box>
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                  <CalendarMonthIcon sx={{ marginRight: '8px' }} />
                  Create Multiple Events
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>By Specific Date</button>
                <button className="subcat" style={{ width: '100%' }}>By Date-range</button>
                <button className="subcat" style={{ width: '100%' }}>By Calendar</button>
                <button className="subcat" style={{ width: '100%' }}>Import Scheduled Events</button>
                <button className="subcat" style={{ width: '100%' }}>Import Completed Events</button>
              </Box>
            </>
          )}
          {submenu === 'approvePay' && (
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
              <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', whiteSpace: 'nowrap' }}>Approve Invoices</Typography>
              <button className="subcat" style={{ width: '100%' }}>Approve Invoices</button>
              <button className="subcat" style={{ width: '100%' }}>Pay Bills</button>
            </Box>
          )}
          {submenu === 'reportAnalyze' && (
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
              <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', whiteSpace: 'nowrap' }}>Report & Analyze</Typography>
              <button className="subcat" style={{ width: '100%' }}>Generate Reports</button>
              <button className="subcat" style={{ width: '100%' }}>Analyze Data</button>
            </Box>
          )}
          {submenu === 'setUp' && (
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
              <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', whiteSpace: 'nowrap' }}>Set Up</Typography>
              <button className="subcat" style={{ width: '100%' }}>User Settings</button>
              <button className="subcat" style={{ width: '100%' }}>Preferences</button>
            </Box>
          )}
          {submenu === 'admin' && (
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '0 8px', whiteSpace: 'nowrap' }}>Admin</Typography>
              <button className="subcat" style={{ width: '100%' }}>Manage Users</button>
              <button className="subcat" style={{ width: '100%' }}>System Settings</button>
            </Box>
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default Navbar;
