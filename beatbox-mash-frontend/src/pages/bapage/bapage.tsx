import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar } from '@mui/material';
import './bapage.css';
import CreateAmbassadorForm from '../../components/createAmbassadorForm/createAmbassadorForm';

const BrandAmbassadorsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);

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
                <TableCell>{'N/A'}</TableCell> {/* No teams data in the database */}
                <TableCell>{user.wage ? `$${user.wage}/h` : 'N/A'}</TableCell>
                <TableCell>{'N/A'}</TableCell> {/* No docsReturned data in the database */}
                <TableCell>{user.date_of_last_request ? new Date(user.date_of_last_request).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell><Button>...</Button></TableCell>
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
