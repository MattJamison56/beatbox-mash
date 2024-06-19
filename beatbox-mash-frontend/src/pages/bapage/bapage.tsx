import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Avatar } from '@mui/material';
import './bapage.css';

const dummyData = [
  { avatar: '', name: 'Aaron Ramos', address: '6000 Ed Bluestein Blvd Apt 13104, Austin, TX 78723', email: 'actor.aaronramos@gmail.com', phone: '2170934715', availability: 'Mon, Tues, Wed, Thurs, Fri, Sat, Sun', teams: 'Austin, Festival BEATS', wage: '$30.00/h', docsReturned: '2 of 2', lastRequest: 'Jan 03, 2024' },
  { avatar: '', name: 'Aasha Lewis-Redway', address: '146-16 228th St, Queens, NY 11413', email: 'aashalewis@gmail.com', phone: '6462862346', availability: 'Mon, Tues, Weds, Fri after 5pm, Saturday & Sunday Open', teams: 'New York', wage: '$30.00/h', docsReturned: '3 of 3', lastRequest: 'Apr 15, 2024' },
  { avatar: '', name: 'Abbie Payne', address: '8736 N 67th Ln, Peoria, AZ 85345', email: 'abbiepayne24@gmail.com', phone: '6233308916', availability: 'Open', teams: 'Arizona, Festival BEATS', wage: '$30.00/h', docsReturned: '2 of 2', lastRequest: 'Feb 16, 2023' },
  // Add more dummy data as needed
];

const BrandAmbassadorsPage: React.FC = () => {
  return (
    <div className="container">
      <div className="header">
        <h1 className='title'>Brand Ambassadors</h1>
        <Button variant="contained" color="primary" className='create-button'>
          Create ambassadors
        </Button>
      </div>
      <TableContainer component={Paper}>
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
            {dummyData.map((ambassador, index) => (
              <TableRow key={index}>
                <TableCell><Avatar alt={ambassador.name} src={ambassador.avatar} /></TableCell>
                <TableCell>{ambassador.name}</TableCell>
                <TableCell>{ambassador.address}</TableCell>
                <TableCell><a href={`mailto:${ambassador.email}`}>{ambassador.email}</a></TableCell>
                <TableCell><a href={`tel:${ambassador.phone}`}>{ambassador.phone}</a></TableCell>
                <TableCell>{ambassador.availability}</TableCell>
                <TableCell>{ambassador.teams}</TableCell>
                <TableCell>{ambassador.wage}</TableCell>
                <TableCell>{ambassador.docsReturned}</TableCell>
                <TableCell>{ambassador.lastRequest}</TableCell>
                <TableCell><Button>...</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default BrandAmbassadorsPage;
