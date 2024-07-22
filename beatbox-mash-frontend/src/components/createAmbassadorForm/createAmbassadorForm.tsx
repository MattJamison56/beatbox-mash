/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, IconButton } from '@mui/material';
import { Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type Ambassador = {
  firstName: string;
  lastName: string;
  email: string;
  wage: string;
  teams: string[];
  certificateExpirationDate: string;
};

const CreateAmbassadorForm: React.FC<{ open: boolean, onClose: () => void, fetchUsers: () => void }> = ({ open, onClose, fetchUsers }) => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([{ firstName: '', lastName: '', email: '', wage: '', teams: [], certificateExpirationDate: '' }]);
  const [requiredDocs, setRequiredDocs] = useState({ alcohol: false, license: false, w9: false });
  const [teams, setTeams] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5000/teams');
      const data = await response.json();
      setTeams(data.map((team: any) => team.name));
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleAddMore = () => {
    setAmbassadors([...ambassadors, { firstName: '', lastName: '', email: '', wage: '', teams: [], certificateExpirationDate: '' }]);
  };

  const handleInputChange = (index: number, field: keyof Ambassador, value: any) => {
    const newAmbassadors = [...ambassadors];
    newAmbassadors[index][field] = value;
    setAmbassadors(newAmbassadors);
  };

  const handleDateChange = (index: number, date: string) => {
    const newAmbassadors = [...ambassadors];
    newAmbassadors[index].certificateExpirationDate = date;
    setAmbassadors(newAmbassadors);
  };

  const handleDeleteRow = (index: number) => {
    const newAmbassadors = ambassadors.filter((_, i) => i !== index);
    setAmbassadors(newAmbassadors);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:5000/ambassadors/createba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ambassadors }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchUsers();
      onClose();
    } catch (error) {
      console.error('Error creating ambassadors:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Ambassadors</DialogTitle>
      <DialogContent>
        {ambassadors.map((ambassador, index) => (
          <div key={index} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <TextField
              label="First Name"
              value={ambassador.firstName}
              onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
              style={{ marginRight: 8, marginTop: 5}}
            />
            <TextField
              label="Last Name"
              value={ambassador.lastName}
              onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Email"
              value={ambassador.email}
              onChange={(e) => handleInputChange(index, 'email', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Wage per Hour"
              value={ambassador.wage}
              onChange={(e) => handleInputChange(index, 'wage', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <Autocomplete
              multiple
              options={teams}
              value={ambassador.teams}
              onChange={(_e, value) => handleInputChange(index, 'teams', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Teams"
                  style={{ marginRight: 8, minWidth: 200, marginTop: 5 }}
                />
              )}
            />
            <TextField
              label="Certificate Expiration Date"
              type="date"
              value={ambassador.certificateExpirationDate}
              onChange={(e) => handleDateChange(index, e.target.value)}
              InputLabelProps={{ shrink: true }}
              style={{ marginRight: 8, marginTop: 5, marginLeft: 8 }}
            />
            {ambassadors.length > 1 && (
              <IconButton onClick={() => handleDeleteRow(index)}>
                <DeleteIcon />
              </IconButton>
            )}
          </div>
        ))}
        <Button onClick={handleAddMore}>Add More</Button>
        <div style={{ marginTop: 16 }}>
          <h4>Assign Trainings</h4>
          <FormControlLabel control={<Checkbox />} label="Training1" />
          <FormControlLabel control={<Checkbox />} label="Training2" />
          <FormControlLabel control={<Checkbox />} label="Training3" />
        </div>
        <div style={{ marginTop: 16 }}>
          <h4>Require Documents</h4>
          <FormControlLabel
            control={
              <Checkbox
                checked={requiredDocs.alcohol}
                onChange={(e) => setRequiredDocs({ ...requiredDocs, alcohol: e.target.checked })}
              />
            }
            label="Alcohol Certification"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={requiredDocs.license}
                onChange={(e) => setRequiredDocs({ ...requiredDocs, license: e.target.checked })}
              />
            }
            label="Drivers License"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={requiredDocs.w9}
                onChange={(e) => setRequiredDocs({ ...requiredDocs, w9: e.target.checked })}
              />
            }
            label="W9"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate} color="primary">Create</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAmbassadorForm;
