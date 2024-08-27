/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { TextField, Button, MenuItem, Typography, Box, Switch, FormControlLabel, Autocomplete, Divider, Radio, RadioGroup, FormControl, FormLabel, IconButton, Menu, ListItemIcon, Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { styled } from '@mui/material/styles';
import { Dayjs } from 'dayjs';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 'bold',
  color: '#6f65ac',
}));

interface BrandAmbassador {
  id: number;
  name: string;
  email: string;
  wage: number;
  inventory: boolean;
  qa: boolean;
  photos: boolean;
  expenses: boolean;
  mileageExpense: boolean;
}

interface CreateEventDateProps {
  onEventCreation: () => void;
}

const CreateEventDate: React.FC<CreateEventDateProps> = ({ onEventCreation }) => {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | ''>('');
  const [selectedVenue, setSelectedVenue] = useState<string | ''>('');
  const [selectedTeam, setSelectedTeam] = useState<string | ''>('');
  const [eventType, setEventType] = useState<string | ''>('');
  const [whoSchedules, setWhoSchedules] = useState('Specific Date');
  const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null);
  const [durationHours, setDurationHours] = useState<number>(3);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [brandAmbassadors, setBrandAmbassadors] = useState<BrandAmbassador[]>([]);
  const [availableBas, setAvailableBas] = useState<BrandAmbassador[]>([]);
  const [selectedBa, setSelectedBa] = useState<BrandAmbassador | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editBaId, setEditBaId] = useState<number | null>(null);
  const [preEventInstructions, setPreEventInstructions] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>('');


  useEffect(() => {
    // Fetch campaigns, venues, teams, and brand ambassadors from the backend
    const fetchData = async () => {
      try {
        const campaignsResponse = await fetch('http://localhost:5000/campaigns');
        const venuesResponse = await fetch('http://localhost:5000/venues');
        const teamsResponse = await fetch('http://localhost:5000/teams');
        const basResponse = await fetch('http://localhost:5000/ambassadors/getAmbassadors');

        const campaignsData = await campaignsResponse.json();
        const venuesData = await venuesResponse.json();
        const teamsData = await teamsResponse.json();
        const basData = await basResponse.json();

        setCampaigns(campaignsData.map((campaign: any) => campaign.name));
        setVenues(venuesData.map((venue: any) => `${venue.name} // ${venue.address}`));
        setTeams(teamsData.map((team: any) => team.name));
        setAvailableBas(basData); // Set available brand ambassadors
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDurationHours(parseInt(event.target.value, 10));
  };

  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDurationMinutes(parseInt(event.target.value, 10));
  };

  const handleAddBa = () => {
    if (selectedBa && !brandAmbassadors.some((ba) => ba.id === selectedBa.id)) {
      const newBa = {
        ...selectedBa,
        inventory: brandAmbassadors.length === 0,
        qa: brandAmbassadors.length === 0,
        photos: true,
        expenses: true,
        mileageExpense: false,
      };
      setBrandAmbassadors((prev) => [...prev, newBa]);
      setSelectedBa(null);
    }
  };

  const handleRemoveBa = () => {
    if (editBaId !== null) {
      setBrandAmbassadors((prev) => prev.filter((ba) => ba.id !== editBaId));
      setEditBaId(null);
      setAnchorEl(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, ba: BrandAmbassador) => {
    setAnchorEl(event.currentTarget);
    setEditBaId(ba.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setEditBaId(null);
  };

  const handleCheckboxChange = (id: number, field: keyof BrandAmbassador) => {
    setBrandAmbassadors((prev) =>
      prev.map((ba) =>
        ba.id === id ? { ...ba, [field]: !ba[field] } : ba
      )
    );
  };  

  const notifyBrandAmbassadors = async (brandAmbassadors: BrandAmbassador[], eventName: any, startDateTime: Dayjs | null, venue: string | '', preEventInstructions: any) => {
    try {
      const response = await fetch('http://localhost:5000/events/notifybas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandAmbassadors,
          eventName,
          startDateTime,
          venue,
          preEventInstructions,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }
  
      console.log('Notifications sent successfully');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const handleCampaignChange = async (_event: React.ChangeEvent<{}>, value: string | null) => {
    setSelectedCampaign(value ?? '');
  
    if (value) {
      try {
        const encodedValue = encodeURIComponent(value);
        const response = await fetch(`http://localhost:5000/campaigns/name/${encodedValue}`);
        if (!response.ok) {
          throw new Error('Failed to fetch campaign details');
        }
        const campaign = await response.json();
        setPreEventInstructions(campaign.pre_event_instructions || '');
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      }
    } else {
      setPreEventInstructions('');
    }
  };
  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const eventData = {
      campaign: selectedCampaign,
      venue: selectedVenue,
      team: selectedTeam,
      eventType,
      eventName: (event.target as any).elements.eventName.value,
      preEventInstructions: (event.target as any).elements.preEventInstructions.value,
      whoSchedules,
      startDateTime,
      durationHours,
      durationMinutes,
      brandAmbassadors,
    };

    try {
      const response = await fetch('http://localhost:5000/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      console.log('Event created successfully');

      notifyBrandAmbassadors(
        brandAmbassadors,
        eventData.eventName,
        eventData.startDateTime,
        eventData.venue,
        eventData.preEventInstructions
      );
      
      onEventCreation();  // Call the function to switch the subcategory
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div className="container" style={{ color: 'black', padding: '20px' }}>
      <h1>Create event by date or range</h1>
      <form onSubmit={handleSubmit}>
        <Section>
          <Autocomplete
            options={campaigns}
            value={selectedCampaign}
            onChange={handleCampaignChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Campaign"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Autocomplete
            options={venues}
            value={selectedVenue}
            onChange={(_event, value) => {
              const name = value?.split(' // ')[0] || ''; // Extract the name
              setSelectedVenue(name); // Store only the name
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Venue"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Autocomplete
            options={teams}
            value={selectedTeam}
            onChange={(_event, value) => setSelectedTeam(value ?? '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Team"
                fullWidth
                margin="normal"
              />
            )}
          />
          <TextField
            name="eventName"
            label="Event Name"
            fullWidth
            margin="normal"
          />
          <TextField
            name="preEventInstructions"
            label="Pre-Event Instructions"
            value={preEventInstructions}
            onChange={(e) => setPreEventInstructions(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            select
            label="Event Type"
            value={eventType || ''}
            onChange={(event) => setEventType(event.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="On Premise">On Premise</MenuItem>
            <MenuItem value="Off Premise">Off Premise</MenuItem>
            <MenuItem value="Festival">Festivals/Events</MenuItem>
            <MenuItem value="Local Event">Local Event</MenuItem>
          </TextField>
          <Box display="flex" gap={2} mt={2} flexDirection={'column'}>
            <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Who Schedules?</FormLabel>
                <RadioGroup row aria-label="whoSchedules" name="whoSchedules" value={whoSchedules} onChange={(e) => setWhoSchedules(e.target.value)}>
                <FormControlLabel value="Specific Date" control={<Radio />} label="I will assign specific date for the event" />
                <FormControlLabel value="Brand Ambassador" control={<Radio />} label="Brand Ambassador" />
                </RadioGroup>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                label="Start Date Time"
                value={startDateTime}
                onChange={(newValue) => setStartDateTime(newValue)}
                />
            </LocalizationProvider>
            <Box display="flex" gap={2} mt={2} sx={{ maxWidth: '300px' }}>
                <TextField
                select
                label="Hours"
                value={durationHours}
                onChange={handleHourChange}
                variant="outlined"
                SelectProps={{
                    MenuProps: {
                    PaperProps: {
                        style: {
                        maxHeight: 200,
                        },
                    },
                    },
                }}
                sx={{ flexGrow: 1 }}
                >
                {[...Array(24).keys()].map((hour) => (
                    <MenuItem key={hour} value={hour}>
                    {hour}
                    </MenuItem>
                ))}
                </TextField>
                <TextField
                select
                label="Minutes"
                value={durationMinutes}
                onChange={handleMinuteChange}
                variant="outlined"
                SelectProps={{
                    MenuProps: {
                    PaperProps: {
                        style: {
                        maxHeight: 200,
                        },
                    },
                    },
                }}
                sx={{ flexGrow: 1 }}
                >
                {[...Array(12).keys()].map((i) => i * 5).map((minute) => (
                    <MenuItem key={minute} value={minute}>
                    {minute}
                    </MenuItem>
                ))}
                </TextField>
            </Box>
          </Box>
        </Section>

        <Divider />

        <Section>
          <FormControlLabel
            control={<Switch checked={true} />}
            label="I want to set BA(s) for this event"
          />
          <Typography variant="h6" style={{ marginTop: '16px' }}>Brand ambassadors</Typography>
          <Autocomplete
            options={availableBas}
            getOptionLabel={(option) => `${option.name} / ${option.email}`}
            value={selectedBa}
            onChange={(_event, value) => setSelectedBa(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Start typing brand ambassador name"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Button onClick={handleAddBa} variant="contained" color="primary" style={{ marginTop: '8px' }}>
            Add Brand Ambassador
          </Button>
          <Box mt={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Brand Ambassador</TableCell>
                  <TableCell>Wage</TableCell>
                  <TableCell>Inventory</TableCell>
                  <TableCell>Q&A</TableCell>
                  <TableCell>Photos</TableCell>
                  <TableCell>Expenses</TableCell>
                  <TableCell>Mileage Expense</TableCell>
                  <TableCell>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brandAmbassadors.map((ba) => (
                  <TableRow key={ba.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle1">{ba.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">${ba.wage.toFixed(2)}/h</Typography>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={ba.inventory}
                        onChange={() => handleCheckboxChange(ba.id, 'inventory')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={ba.qa}
                        onChange={() => handleCheckboxChange(ba.id, 'qa')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={ba.photos}
                        onChange={() => handleCheckboxChange(ba.id, 'photos')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={ba.expenses}
                        onChange={() => handleCheckboxChange(ba.id, 'expenses')}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={ba.mileageExpense}
                        onChange={() => handleCheckboxChange(ba.id, 'mileageExpense')}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(event) => handleMenuClick(event, ba)}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                      >
                        <MenuItem onClick={handleRemoveBa}>
                          <ListItemIcon>
                            <DeleteIcon color="error" />
                          </ListItemIcon>
                          Remove
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Section>

        <Divider />

        <Section>
          <Typography variant="h6">Files</Typography>
          <Button variant="contained" component="label">
            Select files to upload
            <input type="file" hidden />
          </Button>
        </Section>

        <Divider />

        <Section>
          <SectionTitle variant="h6">Additional Info</SectionTitle>
          <TextField
            label="Sales Rep Notes 2"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Primary Program"
            select
            value={selectedProgram || ''}
            onChange={(event) => setSelectedProgram(event.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Program1">Program1</MenuItem>
            <MenuItem value="Program2">Program2</MenuItem>
            {/* Add other programs as needed */}
          </TextField>
          <TextField
            label="Wholesaler"
            select
            value={selectedWholesaler || ''}
            onChange={(event) => setSelectedWholesaler(event.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Wholesaler1">Wholesaler1</MenuItem>
            <MenuItem value="Wholesaler2">Wholesaler2</MenuItem>
            {/* Add other wholesalers as needed */}
          </TextField>
        </Section>

        <Box display="flex" justifyContent="center" marginTop="20px">
          <Button type="submit" variant="contained" color="primary" style={{ margin: '10px' }}>
            Create
          </Button>
          {/* Despite saying on event creation just doesn't submit and sets back to list view for cancel button*/}
          <Button variant="outlined" color="secondary" onClick={onEventCreation} style={{ margin: '10px' }}>
            Cancel
          </Button>
        </Box>
      </form>
    </div>
  );
};

export default CreateEventDate;
