/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  FormGroup,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const apiUrl = import.meta.env.VITE_API_URL;

type Ambassador = {
  firstName: string;
  lastName: string;
  email: string;
  wage: string;
  teams: string[];
  certificateExpirationDate: string;
  trainingIds: number[]; // IDs of selected trainings
};

type TrainingMaterial = {
  id: number;
  name: string;
};

const CreateAmbassadorForm: React.FC<{
  open: boolean;
  onClose: () => void;
  fetchUsers: () => void;
}> = ({ open, onClose, fetchUsers }) => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([
    {
      firstName: '',
      lastName: '',
      email: '',
      wage: '',
      teams: [],
      certificateExpirationDate: '',
      trainingIds: [],
    },
  ]);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [trainings, setTrainings] = useState<TrainingMaterial[]>([]);

  useEffect(() => {
    if (open) {
      fetchTeams();
      fetchTrainings();
    }
  }, [open]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${apiUrl}/teams`);
      const data = await response.json();
      setTeams(data.map((team: any) => team.name));
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await fetch(`${apiUrl}/training/folders`);
      const data = await response.json();
      setTrainings(data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
  };

  const handleAddMore = () => {
    setAmbassadors([
      ...ambassadors,
      {
        firstName: '',
        lastName: '',
        email: '',
        wage: '',
        teams: [],
        certificateExpirationDate: '',
        trainingIds: [],
      },
    ]);
  };

  const handleInputChange = (
    index: number,
    field: keyof Ambassador,
    value: any
  ) => {
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
      const response = await fetch(`${apiUrl}/ambassadors/createba`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ambassadors, requiredDocs }),
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

  const handleRequiredDocsChange = (docType: string, checked: boolean) => {
    if (checked) {
      setRequiredDocs([...requiredDocs, docType]);
    } else {
      setRequiredDocs(requiredDocs.filter((doc) => doc !== docType));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Ambassadors</DialogTitle>
      <DialogContent>
        {ambassadors.map((ambassador, index) => (
          <div
            key={index}
            style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}
          >
            <TextField
              label="First Name"
              value={ambassador.firstName}
              onChange={(e) =>
                handleInputChange(index, 'firstName', e.target.value)
              }
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Last Name"
              value={ambassador.lastName}
              onChange={(e) =>
                handleInputChange(index, 'lastName', e.target.value)
              }
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Email"
              value={ambassador.email}
              onChange={(e) =>
                handleInputChange(index, 'email', e.target.value)
              }
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
              onChange={(_e, value) =>
                handleInputChange(index, 'teams', value)
              }
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
          <Autocomplete
            multiple
            options={trainings}
            getOptionLabel={(option) => option.name}
            onChange={(_e, value) => {
              const trainingIds = value.map((training) => training.id);
              // Assuming you want to assign the same trainings to all ambassadors
              const newAmbassadors = ambassadors.map((amb) => ({
                ...amb,
                trainingIds,
              }));
              setAmbassadors(newAmbassadors);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Trainings"
                style={{ minWidth: 300 }}
              />
            )}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <h4>Require Documents</h4>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={requiredDocs.includes('alcohol_certification')}
                  onChange={(e) =>
                    handleRequiredDocsChange(
                      'alcohol_certification',
                      e.target.checked
                    )
                  }
                />
              }
              label="Alcohol Certification"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={requiredDocs.includes('drivers_license')}
                  onChange={(e) =>
                    handleRequiredDocsChange(
                      'drivers_license',
                      e.target.checked
                    )
                  }
                />
              }
              label="Driver's License"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={requiredDocs.includes('w9')}
                  onChange={(e) =>
                    handleRequiredDocsChange('w9', e.target.checked)
                  }
                />
              }
              label="W9"
            />
          </FormGroup>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate} color="primary">
          Create
        </Button>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAmbassadorForm;
