/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateVenueForm from '../../components/createVenueForm/createVenueForm';
import EditVenueForm from '../../components/editVenueForm/editVenueForm';
import EditIcon from '@mui/icons-material/Edit';
import { EditTeamsForm } from '../../components/editTeamsForm/editTeamsForm';

const CreateVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVenue, setSelectedVenue] = useState<null | any>(null);
  const [editVenueData, setEditVenueData] = useState<null | any>(null);

  const [editTeamsOpen, setEditTeamsOpen] = useState(false);
  const [currentTeams, setCurrentTeams] = useState<string[]>([]);
  const [currentVenueId, setCurrentVenueId] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);

  const handleEditTeams = (venue: any) => {
    setCurrentTeams(venue.teams || []);
    setCurrentVenueId(venue.id);
    setEditTeamsOpen(true);
  };

  const handleCloseEditTeams = () => {
    setEditTeamsOpen(false);
    setCurrentTeams([]);
    setCurrentVenueId(null);
  };

  const handleSaveTeams = async (venueId: string | null, newTeams: string[]) => {
    if (!venueId) return;

    try {
      const response = await fetch(`http://localhost:5000/venues/updatevenueteams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: venueId, teams: newTeams }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setVenues(venues.map(venue => venue.id === venueId ? { ...venue, teams: newTeams } : venue));
      await fetchVenues(); // reload table
    } catch (error) {
      console.error('Error updating teams:', error);
    }
  };

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleOpenEditForm = (venue: any) => {
    setEditVenueData(venue);
    setEditFormOpen(true);
  };

  const handleCloseEditForm = () => {
    setEditFormOpen(false);
    setEditVenueData(null);
  };

  const fetchVenues = async () => {
    try {
      const response = await fetch('http://localhost:5000/venues');
      const data = await response.json();
      setVenues(data);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/teams')
      .then(response => response.json())
      .then(data => setTeams(data.map((team: any) => team.name)))
      .catch(error => console.error('Error fetching teams:', error));
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, venue: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedVenue(venue);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVenue(null);
  };

  const handleView = () => {
    console.log('View venue:', selectedVenue);
    handleMenuClose();
  };

  const handleDeactivate = async () => {
    try {
      const response = await fetch(`http://localhost:5000/venues/deletevenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedVenue.id }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setVenues(venues.filter(venue => venue.id !== selectedVenue.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error deactivating venue:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className='title'>Venues</h1>
        <Button variant="contained" color="primary" onClick={handleOpenForm}>
          Create Venue
        </Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Contact 1</TableCell>
              <TableCell>Contact 2</TableCell>
              <TableCell>Last Time Visited</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {venues.map((venue, index) => (
              <TableRow key={index}>
                <TableCell>{venue.name}</TableCell>
                <TableCell>{venue.address}</TableCell>
                <TableCell>{venue.region}</TableCell>
                <TableCell>{venue.teams ? `${venue.teams}` : 'N/A'}
                  <IconButton onClick={() => handleEditTeams(venue)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{venue.comment}</TableCell>
                <TableCell>
                  Name: {venue.contact1_name}<br />
                  Phone: <a href={`tel:${venue.contact1_phone}`}>{venue.contact1_phone}</a>
                </TableCell>
                <TableCell>
                  Name: {venue.contact2_name}<br />
                  Phone: <a href={`tel:${venue.contact2_phone}`}>{venue.contact2_phone}</a>
                </TableCell>
                <TableCell>{venue.last_time_visited ? new Date(venue.last_time_visited).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, venue)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleView}>View</MenuItem>
                    <MenuItem onClick={() => handleOpenEditForm(selectedVenue)}>Edit</MenuItem>
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateVenueForm open={openForm} onClose={handleCloseForm} fetchVenues={fetchVenues} />
      <EditVenueForm open={editFormOpen} onClose={handleCloseEditForm} fetchVenues={fetchVenues} venueData={editVenueData} />
      <EditTeamsForm 
        open={editTeamsOpen} 
        onClose={handleCloseEditTeams} 
        currentTeams={currentTeams} 
        entityId={currentVenueId} 
        teams={teams} 
        onSave={handleSaveTeams} 
      />
    </div>
  );
};

export default CreateVenuesPage;
