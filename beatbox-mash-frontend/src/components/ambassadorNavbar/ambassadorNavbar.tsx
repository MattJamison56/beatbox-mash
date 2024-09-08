/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, MouseEvent, useEffect } from 'react';
import { AppBar, Toolbar, Box, Avatar, Menu, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './baNavbar.css';
import logo from '../../assets/beatboxlogo.png';
const apiUrl = import.meta.env.VITE_API_URL;

interface AmbassadorNavbarProps {
  onTabChange: (tab: string) => void;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar_url: string;
}

const AmbassadorNavbar: React.FC<AmbassadorNavbarProps> = ({ onTabChange }) => {
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
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

  const handleAccountMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAccountMenuAnchorEl(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchorEl(null);
  };

  const handleSwitchToManager = () => {
    handleAccountMenuClose();
    if (userProfile?.role === 'manager') {
      navigate('/manager');
    } else {
      window.location.href = 'https://beatboxbeverages.com/';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div>
      <AppBar position="fixed" style={{ backgroundColor: '#5a50a0', zIndex: 1201, padding: '8px' }}>
        <Toolbar>
          <Button onClick={() => handleTabClick('DASHBOARD')}>
            <img src={logo} alt="Logo" className="logo" />
          </Button>
          <Box display="flex" flexGrow={1}>
            {['DASHBOARD', 'EVENTS', 'MY BIDS', 'INVOICES', 'COMPLETED REPORTS', 'DOCUMENTS'].map(tab => (
              <Button
                key={tab}
                className={`navButton ${activeTab === tab ? 'active' : ''}`}
                color="inherit"
                onClick={() => handleTabClick(tab)}
                style={{ color: '#FFFFFF', fontWeight: activeTab === tab ? 'bold' : 'normal' }}
              >
                {tab}
              </Button>
            ))}
          </Box>
          <Box display="flex" justifyContent="flex-end" ml="auto">
            <Button onClick={handleAccountMenuOpen} className="accountButton">
              <Avatar
                src={userProfile?.avatar_url || 'https://example.com/default-avatar.png'}
                alt={userProfile?.name || 'User Avatar'}
                className="avatar"
              />
              <Box ml={1}>
                <h4 style={{ color: '#FFFFFF', marginBottom: '0px', textAlign: 'left' }}>{userProfile?.name ? userProfile.name : ''}</h4>
                <h5 style={{ color: '#FFFFFF', marginTop: '0px' }}>Beatbox Beverages</h5>
              </Box>
            </Button>
            <Menu
              anchorEl={accountMenuAnchorEl}
              open={Boolean(accountMenuAnchorEl)}
              onClose={handleAccountMenuClose}
            >
              <MenuItem onClick={handleAccountMenuClose}>Notifications</MenuItem>
              <MenuItem onClick={() => handleTabClick('Profile')}>My Profile</MenuItem>
              <MenuItem onClick={handleSwitchToManager}>BeatBox Beverages</MenuItem>
              <MenuItem onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </div>
  );
};

export default AmbassadorNavbar;
