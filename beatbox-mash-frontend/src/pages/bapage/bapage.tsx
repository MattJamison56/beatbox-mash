/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import './bapage.css';
import CreateAmbassadorForm from '../../components/createAmbassadorForm/createAmbassadorForm';
import EditIcon from '@mui/icons-material/Edit';
import { EditTeamsForm } from '../../components/editTeamsForm/editTeamsForm';
import { EditWageForm } from '../../components/editWageForm/editWageForm';


const BrandAmbassadorsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<null | any>(null);

  const [editTeamsOpen, setEditTeamsOpen] = useState(false);
  const [currentTeams, setCurrentTeams] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);

  const [editWageOpen, setEditWageOpen] = useState(false);
  const [currentWage, setCurrentWage] = useState<number>(0);

  const handleEditTeams = (user: any) => {
    setCurrentTeams(user.teams || []);
    setCurrentUserId(user.id);
    setEditTeamsOpen(true);
  };

  const handleCloseEditTeams = () => {
    setEditTeamsOpen(false);
    setCurrentTeams([]);
    setCurrentUserId(null);
  };

  const handleEditWage = (user: any) => {
    setCurrentWage(user.wage || 0);
    setCurrentUserId(user.id);
    setEditWageOpen(true);
  };

  const handleCloseEditWage = () => {
    setEditWageOpen(false);
    setCurrentWage(0);
    setCurrentUserId(null);
  };

  const handleSaveTeams = async (userId: string | null, newTeams: string[]) => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/ambassadors/updateBATeams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, teams: newTeams }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Update the user teams in the state
      setUsers(users.map(user => user.id === userId ? { ...user, teams: newTeams } : user));
      await fetchUsers(); // reload table
    } catch (error) {
      console.error('Error updating teams:', error);
    }
  };

  const handleSaveWage = async (userId: string | null, newWage: number) => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/ambassadors/updateBAWage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, wage: newWage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setUsers(users.map(user => user.id === userId ? { ...user, wage: newWage } : user));
      await fetchUsers(); // reload table
    } catch (error) {
      console.error('Error updating wage:', error);
    }
  };

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/ambassadors/getAmbassadors');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/teams')
      .then(response => response.json())
      .then(data => setTeams(data.map((team: any) => team.name)))
      .catch(error => console.error('Error fetching teams:', error));
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
                <TableCell>{'N/A'}</TableCell> 
                <TableCell>{user.teams ? `${user.teams}` : 'N/A'} 
                  <IconButton onClick={() => handleEditTeams(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{user.wage ? `$${user.wage}/h` : 'N/A'} 
                  <IconButton onClick={() => handleEditWage(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{'N/A'}</TableCell>
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
      <CreateAmbassadorForm open={openForm} onClose={handleCloseForm} fetchUsers={fetchUsers}/>
      <EditTeamsForm 
        open={editTeamsOpen} 
        onClose={handleCloseEditTeams} 
        currentTeams={currentTeams} 
        entityId={currentUserId} 
        teams={teams} 
        onSave={handleSaveTeams} 
      />
      <EditWageForm 
        open={editWageOpen} 
        onClose={handleCloseEditWage} 
        currentWage={currentWage} 
        userId={currentUserId} 
        onSave={handleSaveWage} 
      />
    </div>
  );
};

export default BrandAmbassadorsPage;
