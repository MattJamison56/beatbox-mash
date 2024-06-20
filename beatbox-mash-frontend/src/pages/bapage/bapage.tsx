/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import './bapage.css';
import CreateAmbassadorForm from '../../components/createAmbassadorForm/createAmbassadorForm';

const BrandAmbassadorsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<null | any>(null);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  useEffect(() => {
    fetch('http://localhost:5000/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleView = () => {
    // Placeholder function for View
    console.log('View user:', selectedUser);
    handleMenuClose();
  };

  const handleShareTrainingMaterial = () => {
    // Placeholder function for Share Training Material
    console.log('Share training material for user:', selectedUser);
    handleMenuClose();
  };

  const handleRequestDocument = () => {
    // Placeholder function for Request Document
    console.log('Request document for user:', selectedUser);
    handleMenuClose();
  };

  const handleDeactivate = async () => {
    try {
      const response = await fetch(`http://localhost:5000/ambassadors/deleteba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedUser.id }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Remove user from the state
      setUsers(users.filter(user => user.id !== selectedUser.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className='title'>Brand Ambassadors</h1>
        <Button variant="contained" color="primary" onClick={handleOpenForm}>
          Create ambassadors
        </Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px'}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Wage</TableCell>
              <TableCell>Docs Returned</TableCell>
              <TableCell>Date of Last Request</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={index}>
                <TableCell><Avatar alt={user.name} src={user.avatar_url} /></TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.address}</TableCell>
                <TableCell><a href={`mailto:${user.email}`}>{user.email}</a></TableCell>
                <TableCell><a href={`tel:${user.phone_number}`}>{user.phone_number}</a></TableCell>
                <TableCell>{'N/A'}</TableCell> {/* No availability data in the database */}
                <TableCell>{user.teams}</TableCell> {/* Display teams */}
                <TableCell>{user.wage ? `$${user.wage}/h` : 'N/A'}</TableCell>
                <TableCell>{'N/A'}</TableCell> {/* No docsReturned data in the database */}
                <TableCell>{user.date_of_last_request ? new Date(user.date_of_last_request).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, user)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleView}>View</MenuItem>
                    <MenuItem onClick={handleShareTrainingMaterial}>Share Training Material</MenuItem>
                    <MenuItem onClick={handleRequestDocument}>Request Document</MenuItem>
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateAmbassadorForm open={openForm} onClose={handleCloseForm} />
    </div>
  );
};

export default BrandAmbassadorsPage;
