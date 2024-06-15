import React, { useState, MouseEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import logo from '../../assets/beatboxlogo.png';
import './navbar.css';

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
        PaperProps={{ style: { width: '100%', top: 64, position: 'absolute', zIndex: 1200 } }}
      >
        <Box p={2}>
          {submenu === 'planEvents' && (
            <List>
              <ListItem button>
                <ListItemText primary="View Events" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Create Single Event" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Create Multiple Events" />
              </ListItem>
            </List>
          )}
          {submenu === 'approvePay' && (
            <List>
              <ListItem button>
                <ListItemText primary="Approve Invoices" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Pay Bills" />
              </ListItem>
            </List>
          )}
          {submenu === 'reportAnalyze' && (
            <List>
              <ListItem button>
                <ListItemText primary="Generate Reports" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Analyze Data" />
              </ListItem>
            </List>
          )}
          {submenu === 'setUp' && (
            <List>
              <ListItem button>
                <ListItemText primary="User Settings" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Preferences" />
              </ListItem>
            </List>
          )}
          {submenu === 'admin' && (
            <List>
              <ListItem button>
                <ListItemText primary="Manage Users" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="System Settings" />
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default Navbar;
