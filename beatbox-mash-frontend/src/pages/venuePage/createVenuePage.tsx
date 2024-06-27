/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateVenueForm from '../../components/createVenueForm/createVenueForm';
import EditIcon from '@mui/icons-material/Edit';

const CreateVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVenue, setSelectedVenue] = useState<null | any>(null);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
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
                  <IconButton onClick={() => console.log('Edit teams')}>
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
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateVenueForm open={openForm} onClose={handleCloseForm} fetchVenues={fetchVenues} />
    </div>
  );
};

export default CreateVenuesPage;
