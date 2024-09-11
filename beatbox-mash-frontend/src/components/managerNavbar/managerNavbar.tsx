/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, MouseEvent, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import DvrIcon from '@mui/icons-material/Dvr';
import PersonIcon from '@mui/icons-material/Person';
import logo from '../../assets/beatboxlogo.png';
import './navbar.css';
const apiUrl = import.meta.env.VITE_API_URL;


interface NavbarProps {
  onSubcategoryChange: (subcategory: string | null) => void;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar_url: string;
}

const Navbar: React.FC<NavbarProps> = ({ onSubcategoryChange }) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [submenu, setSubmenu] = useState<string | null>(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      const storedAvatarUrl = localStorage.getItem('avatar_url');
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        const { name, email, role } = data;
        
        if (
          !userProfile ||
          userProfile.name !== name ||
          userProfile.email !== email ||
          userProfile.avatar_url !== storedAvatarUrl
        ) {
          setUserProfile({
            name,
            email,
            role,
            avatar_url: storedAvatarUrl || data.avatar_url,
          });
        }

      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const updatedAvatarUrl = localStorage.getItem('avatar_url');
    if (updatedAvatarUrl && userProfile && (updatedAvatarUrl != userProfile.avatar_url)) {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        avatar_url: updatedAvatarUrl,
      }));
    }
  }, [userProfile, localStorage.getItem('avatar_url')]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setSubmenu(event.currentTarget.getAttribute('data-submenu'));
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSubmenu(null);
  };

  const handleSubcatClick = (subcategory: string) => {
    onSubcategoryChange(subcategory);
    setDrawerOpen(false);
    setAccountMenuAnchorEl(null);
  };

  const handleAccountMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAccountMenuAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchorEl(null);
  };

  const handleSwitchToBA = () => {
    handleAccountMenuClose();
    navigate('/ambassadors');
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <AppBar position="fixed" style={{ backgroundColor: '#5a50a0', zIndex: 1201, padding: '8px' }}>
        <Toolbar>
          <Button onClick={() => handleSubcatClick('')}>
            <img src={logo} alt="Logo" className="logo" />
          </Button>
          <Button className="navButton" color="inherit" data-submenu="planEvents" onClick={handleClick}>Plan Events</Button>
          <Button className="navButton" color="inherit" data-submenu="approvePay" onClick={handleClick}>Approve & Pay</Button>
          <Button className="navButton" color="inherit" data-submenu="reportAnalyze" onClick={handleClick}>Report & Analyze</Button>
          <Button className="navButton" color="inherit" data-submenu="setUp" onClick={handleClick}>Set Up</Button>
          <Button className="navButton" color="inherit" data-submenu="admin" onClick={handleClick}>Admin</Button>
          <Box flexGrow={1} />
          <Button onClick={handleAccountMenuOpen} className="accountButton">
          <Avatar
            src={userProfile?.avatar_url || 'https://example.com/default-avatar.png'}
            alt={userProfile?.name || 'User Avatar'}
            className="avatar"
          />
            <Box ml={1}>
              <h4 style={{ color: '#FFFFFF', marginBottom: '0px', textAlign: 'left'}}>{userProfile?.name ? userProfile.name : ''}</h4>
              <h5 style={{ color: '#FFFFFF', marginTop: '0px'}}>Beatbox Beverages</h5>
            </Box>
          </Button>
          <Menu
            anchorEl={accountMenuAnchorEl}
            open={Boolean(accountMenuAnchorEl)}
            onClose={handleAccountMenuClose}
          >
            <MenuItem onClick={handleAccountMenuClose}>Notifications</MenuItem>
            <MenuItem onClick={() => handleSubcatClick('Profile')}>My Profile</MenuItem>
            <MenuItem onClick={handleSwitchToBA}>Switch to BA</MenuItem>
            <MenuItem onClick={handleLogout}>Log Out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Toolbar />

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
                  <EventNoteIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                  View Events
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('List Events')}>List View</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Calendar View')}>Calendar View</button>
                <button className="subcat" style={{ width: '100%' }}>Map View</button>
                <button className="subcat" style={{ width: '100%' }}>Check In Status</button>
              </Box>
              <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                  <CalendarTodayIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                  Create Single Event
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Create Event Date')}>By Date or Range</button>
                <button className="subcat" style={{ width: '100%' }}>By Calendar</button>
                <button className="subcat" style={{ width: '100%' }}>By Map by Venue</button>
                <button className="subcat" style={{ width: '100%' }}>By Map by BA</button>
                <button className="subcat" style={{ width: '100%' }}>By Multi Shift</button>
              </Box>
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                  <CalendarMonthIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
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
            <>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <EditNoteIcon sx={{ marginRight: '8px' }} fontSize='large'/>
                    Approvals
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Approve Submitted Events')}>Approve Submitted Events</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <CreditCardIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Accounting
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Manage Payroll')}>Manage Payroll</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Payment History')}>Payment History</button>
            </Box>
            </>
          )}

          {submenu === 'reportAnalyze' && (
            <>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <ContentPasteIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Reporting
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Completed Reports')}>Completed Reports</button>
                <button className="subcat" style={{ width: '100%' }}>Photo Gallery</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <EqualizerIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Analysis
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Sales Results')}>Sales Results</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Q&A Numerical Results')}>Q&A Numerical Results</button>
                <button className="subcat" style={{ width: '100%' }}>Q&A Written Answers</button>
                <button className="subcat" style={{ width: '100%' }}>Raw Data</button>
            </Box>
            </>
          )}

          {submenu === 'setUp' && (
            <>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '15px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <ContentPasteIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Templates
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Campaigns')}>Campaigns</button>
                <button className="subcat" style={{ width: '100%' }}>Inventory Report</button>
                <button className="subcat" style={{ width: '100%' }}>Post-Event Questions</button>
                <button className="subcat" style={{ width: '100%' }}>Exporting Templates</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '15px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <FormatListBulletedIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Lists
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Brand Ambassadors')}>Brand Ambassadors</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Venues')}>Venues</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Products')}>Products</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', paddingRight: '15px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <ContentPasteIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Assets
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>Training Materials</button>
                <button className="subcat" style={{ width: '100%' }}>Required Docs</button>
            </Box>
            </>
          )}

          {submenu === 'admin' && (
            <>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <SettingsIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    General
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>Company Settings</button>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Teams')}>Teams</button>
                <button className="subcat" style={{ width: '100%' }}>Regions</button>
                <button className="subcat" style={{ width: '100%' }}>Integrations</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <LocalAtmIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Expenses
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>General Settings</button>
                <button className="subcat" style={{ width: '100%' }}>Expense Categories</button>
                <button className="subcat" style={{ width: '100%' }}>Payment Methods</button>
                <button className="subcat" style={{ width: '100%' }}>Mileage Calculations</button>
                <button className="subcat" style={{ width: '100%' }}>Time Presets</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', borderRight: '1px solid gray', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '20px', color: '#6f65ac'}}>
                    <DvrIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Custom Fields
                </Typography>
                <button className="subcat" style={{ width: '100%' }}>Campaigns</button>
                <button className="subcat" style={{ width: '100%' }}>Events</button>
                <button className="subcat" style={{ width: '100%' }}>Venues</button>
                <button className="subcat" style={{ width: '100%' }}>Products</button>
                <button className="subcat" style={{ width: '100%' }}>Contacts</button>
            </Box>
            <Box mr={2} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', paddingRight: '10px' }}>
                <Typography variant="h6" sx={{ display: 'inline-flex', alignItems: 'center', padding: '10px', whiteSpace: 'nowrap', paddingRight: '50px', color: '#6f65ac'}}>
                    <PersonIcon sx={{ marginRight: '8px' }} fontSize='medium'/>
                    Rights & Roles
                </Typography>
                <button className="subcat" style={{ width: '100%' }} onClick={() => handleSubcatClick('Brand Managers')}>Brand Managers</button>
            </Box>
            </>
          )}
          
        </Box>
      </Drawer>
    </div>
  );
};

export default Navbar;