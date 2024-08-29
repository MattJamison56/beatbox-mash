/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import { EditTeamsForm } from '../../../components/editTeamsForm/editTeamsForm';
const apiUrl = import.meta.env.VITE_API_URL;

const ManageAccountsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<null | any>(null);

  const [editTeamsOpen, setEditTeamsOpen] = useState(false);
  const [currentTeams, setCurrentTeams] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);

  const navigate = useNavigate();

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

  const handleSaveTeams = async (userId: string | null, newTeams: string[]) => {
    if (!userId) return;

    try {
      const response = await fetch(`${apiUrl}/managers/updateTeams`, {
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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/managers`);
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
    fetch(`${apiUrl}/teams`)
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

  const handleDeactivate = async () => {
    try {
      const response = await fetch(`${apiUrl}/managers/delete`, {
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
        <h1 className='title'>Managers</h1>
        <Button variant="contained" color="primary" onClick={() => navigate('/create-account')}>
          Add Manager
        </Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={index}>
                <TableCell><Avatar alt={user.name} src={user.avatar_url} /></TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell><a href={`mailto:${user.email}`}>{user.email}</a></TableCell>
                <TableCell>{user.teams ? `${user.teams}` : 'N/A'}
                  <IconButton onClick={() => handleEditTeams(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
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
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <EditTeamsForm
        open={editTeamsOpen}
        onClose={handleCloseEditTeams}
        currentTeams={currentTeams}
        entityId={currentUserId}
        teams={teams}
        onSave={handleSaveTeams}
      />
    </div>
  );
};

export default ManageAccountsPage;
