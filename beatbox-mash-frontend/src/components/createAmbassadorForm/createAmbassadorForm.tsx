import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, FormControl, InputLabel, Checkbox, FormControlLabel } from '@mui/material';

const dummyTeams = ['CHICAGO', 'Austin', 'Beats Training Deck', 'BEATS Training NY 2024'];

const CreateAmbassadorForm: React.FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
  const [ambassadors, setAmbassadors] = useState([{ firstName: '', lastName: '', email: '', wage: '', teams: '', certificateExpirationDate: '' }]);
  const [requiredDocs, setRequiredDocs] = useState({ alcohol: false, license: false, w9: false });

  const handleAddMore = () => {
    setAmbassadors([...ambassadors, { firstName: '', lastName: '', email: '', wage: '', teams: '', certificateExpirationDate: '' }]);
  };

  const handleInputChange = (index: number, field: string, value: any) => {
    const newAmbassadors = [...ambassadors];
    newAmbassadors[index][field] = value;
    setAmbassadors(newAmbassadors);
  };

  const handleDateChange = (index: number, date: string) => {
    const newAmbassadors = [...ambassadors];
    newAmbassadors[index].certificateExpirationDate = date;
    setAmbassadors(newAmbassadors);
  };

  const handleCreate = () => {
    // Placeholder for create logic
    console.log('Creating ambassadors:', ambassadors);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Ambassadors</DialogTitle>
      <DialogContent>
        {ambassadors.map((ambassador, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <TextField
              label="First Name"
              value={ambassador.firstName}
              onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
              style={{ marginRight: 8 }}
            />
            <TextField
              label="Last Name"
              value={ambassador.lastName}
              onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
              style={{ marginRight: 8 }}
            />
            <TextField
              label="Email"
              value={ambassador.email}
              onChange={(e) => handleInputChange(index, 'email', e.target.value)}
              style={{ marginRight: 8 }}
            />
            <TextField
              label="Wage per Hour"
              value={ambassador.wage}
              onChange={(e) => handleInputChange(index, 'wage', e.target.value)}
              style={{ marginRight: 8 }}
            />
            <FormControl style={{ marginRight: 8 }}>
              <InputLabel>Teams</InputLabel>
              <Select
                value={ambassador.teams}
                onChange={(e) => handleInputChange(index, 'teams', e.target.value)}
              >
                {dummyTeams.map((team) => (
                  <MenuItem key={team} value={team}>
                    {team}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Certificate Expiration Date"
              type="date"
              value={ambassador.certificateExpirationDate}
              onChange={(e) => handleDateChange(index, e.target.value)}
              InputLabelProps={{ shrink: true }}
              style={{ marginRight: 8 }}
            />
          </div>
        ))}
        <Button onClick={handleAddMore}>Add More</Button>
        <div style={{ marginTop: 16 }}>
          <h4>Share Files</h4>
          {/* Placeholder checkboxes for share files */}
          <FormControlLabel control={<Checkbox />} label="Public" />
          <FormControlLabel control={<Checkbox />} label="CHICAGO" />
          <FormControlLabel control={<Checkbox />} label="Austin" />
          <FormControlLabel control={<Checkbox />} label="Beats Training Deck" />
          <FormControlLabel control={<Checkbox />} label="BEATS Training NY 2024" />
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
