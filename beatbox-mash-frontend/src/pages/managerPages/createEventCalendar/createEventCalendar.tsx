/* eslint-disable prefer-const */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Ambassadors are getting parsed but then when i set the events they get unparsed??? Idk whats happening probably some type issue.

import React, { useState, useEffect } from 'react';
import {
  TextField, Button, MenuItem, Typography, Box, Checkbox, Autocomplete, Divider, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Avatar, Menu, ListItemIcon
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { Dayjs } from 'dayjs';
import { filter } from 'lodash';

const localizer = momentLocalizer(moment); // Initialize localizer for Calendar

const apiUrl = import.meta.env.VITE_API_URL;

interface BrandAmbassador {
  id: number;
  name: string;
  email?: string;
  wage?: number;
  inventory?: boolean;
  qa?: boolean;
  photos?: boolean;
  expenses?: boolean;
  mileageExpense?: boolean;
  avatar_url: string;
  status: string;
}

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  venue: string;
  ambassadors: BrandAmbassador[];
  eventStatus: string;
  acceptedAmbassadorsCount: number;
  totalAmbassadorsCount: number;
  pendingAmbassadorsCount: number;
  declinedAmbassadorsCount: number;
  paid: boolean;

}

interface CreateEventCalendarProps {
  onEventCreation: () => void;
}

const CreateEventCalendar: React.FC<CreateEventCalendarProps> = ({ onEventCreation }) => {
  const [campaigns, setCampaigns] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | ''>('');
  const [selectedVenue, setSelectedVenue] = useState<string | ''>('');
  const [selectedTeam, setSelectedTeam] = useState<string | ''>('');
  const [brandAmbassadors, setBrandAmbassadors] = useState<BrandAmbassador[]>([]);
  const [selectedBa, setSelectedBa] = useState<BrandAmbassador | null>(null);
  const [availableBas, setAvailableBas] = useState<BrandAmbassador[]>([]);
  const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null);
  const [durationHours, setDurationHours] = useState<number>(3);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [preEventInstructions, setPreEventInstructions] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editBaId, setEditBaId] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedWholesaler, setSelectedWholesaler] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventType, setEventType] = useState<string | ''>('');
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Fetching data (campaigns, venues, teams, brand ambassadors)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaignsResponse = await fetch(`${apiUrl}/campaigns`);
        const venuesResponse = await fetch(`${apiUrl}/venues`);
        const teamsResponse = await fetch(`${apiUrl}/teams`);
        const basResponse = await fetch(`${apiUrl}/ambassadors/getAmbassadors`);

        const campaignsData = await campaignsResponse.json();
        const venuesData = await venuesResponse.json();
        const teamsData = await teamsResponse.json();
        const basData = await basResponse.json();

        setTeams(teamsData.map((team: any) => team.name));
        setCampaigns(campaignsData.map((campaign: any) => campaign.name));
        setVenues(venuesData.map((venue: any) => venue.name));
        setAvailableBas(basData);
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

  const handleCampaignChange = async (_event: React.ChangeEvent<{}>, value: string | null) => {
    setSelectedCampaign(value ?? '');
  
    if (value) {
      try {
        const encodedValue = encodeURIComponent(value);
        const response = await fetch(`${apiUrl}/campaigns/name/${encodedValue}`);
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

  const formatTime = (date: Date) => {
    const hours = date.getHours() % 12 || 12; // Converts 24-hour format to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensures two-digit minutes
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
  };

  // Fetching calendar events related to selected brand ambassadors and venues
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${apiUrl}/events/eventswithambassadors`);
        const data = await response.json();
  
        const formattedEvents = data.map((event: any) => {
          const startTime = formatTime(new Date(event.startDateTime));
          const endTime = formatTime(new Date(event.endDateTime));
          
          // Safely parse the ambassadors field
          let parsedAmbassadors;
          try {
            parsedAmbassadors = event.ambassadors ? JSON.parse(event.ambassadors) : [];
          } catch (error) {
            console.error(`Error parsing ambassadors for event ${event.id}:`, error);
            parsedAmbassadors = [];
          }
  
          return {
            ...event,
            id: event.id,
            title: `${startTime} - ${endTime}, ${event.eventName}`,
            start: new Date(event.startDateTime),
            end: new Date(event.endDateTime),
            acceptedAmbassadorsCount: event.acceptedAmbassadorsCount,
            pendingAmbassadorsCount: event.pendingAmbassadorsCount,
            declinedAmbassadorsCount: event.declinedAmbassadorsCount,
            totalAmbassadorsCount: event.totalAmbassadorsCount,
            paid: event.paid,
            eventStatus: event.eventStatus,
            ambassadors: parsedAmbassadors, // Assign parsedAmbassadors after spreading event
          };
          
        });
  
        setEvents(formattedEvents); // Update state with formatted events
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
  
    fetchEvents();
  }, []); // Fetch events once on mount  

  // Filter events by selected ambassadors and venue
  const filterEvents = () => {
    let filtered = events.filter((event) => {
      // Check if event matches selected ambassadors
      const matchesAmbassadors = brandAmbassadors.length > 0
        ? event.ambassadors.some((ambassador: any) =>
            brandAmbassadors.find((ba) => ba.id === ambassador.id)
          )
        : false;
  
      // Check if event matches selected venue
      const matchesVenue = selectedVenue
        ? event.venue.toLowerCase() === selectedVenue.toLowerCase()
        : false;
  
      // Include event if it matches either ambassadors or venue
      return matchesAmbassadors || matchesVenue;
    });
  
    setFilteredEvents(filtered); // Update the events shown on the calendar
  };
  

  // Whenever brand ambassadors or venue change, filter the events
  useEffect(() => {
    filterEvents();
  }, [brandAmbassadors, selectedVenue]);
  

  const eventStyleGetter = (event: Event) => {
    let borderColor = "#3174ad"; // Default color
  
    if (event.eventStatus === 'Upcoming') {
      if (event.acceptedAmbassadorsCount === event.totalAmbassadorsCount && event.totalAmbassadorsCount > 0) {
        // All ambassadors have accepted
        borderColor = "#32CD32"; // Green
      } else if (
        event.acceptedAmbassadorsCount === 0 &&
        (event.declinedAmbassadorsCount + event.pendingAmbassadorsCount === event.totalAmbassadorsCount)
      ) {
        // All ambassadors have declined or pending
        borderColor = "#FF6347"; // Red
      } else if (event.declinedAmbassadorsCount > 0 || event.pendingAmbassadorsCount > 0) {
        // Some ambassadors have declined or pending
        borderColor = "#FFA500"; // Orange
      }
    } else if (event.eventStatus === 'Completed') {
      if (event.paid) {
        // Event is paid
        borderColor = "#32CD32"; // Green
      } else {
        // Event is not paid yet
        borderColor = "#FFA500"; // Orange
      }
    }
  
    return {
      style: {
        border: `2px solid ${borderColor}`,
        backgroundColor: "transparent",
        color: "black",
        borderRadius: '5px',
        padding: "5px",
      },
    };
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
      const response = await fetch(`${apiUrl}/events/notifybas`, {
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

  const checkConflicts = () => {
    let hasConflict = false;
    const conflictingEvents: string[] = [];
  
    events.forEach((event) => {
      // Check for overlapping time range
      const selectedStart = startDateTime?.toDate();
      const selectedEnd = new Date(selectedStart!.getTime() + durationHours * 3600000 + durationMinutes * 60000);
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
  
      // Check for time overlap
      const isOverlapping = selectedStart! < eventEnd && selectedEnd > eventStart;
  
      if (isOverlapping) {
        // Check for venue conflict
        if (selectedVenue && selectedVenue.toLowerCase() === event.venue.toLowerCase()) {
          conflictingEvents.push(`Venue is already booked for event "${event.title}" during this time.`);
          hasConflict = true;
        }
  
        // Check for ambassador conflict
        event.ambassadors.forEach((ambassador: BrandAmbassador) => {
          if (brandAmbassadors.find((ba) => ba.id === ambassador.id)) {
            conflictingEvents.push(
              `Brand ambassador ${ambassador.name} is already booked for event "${event.title}" during this time.`
            );
            hasConflict = true;
          }
        });
      }
    });
  
    return { hasConflict, conflictingEvents };
  };  

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("attempt to submit");
    
     // Check for conflicts
    const { hasConflict, conflictingEvents } = checkConflicts();

    if (hasConflict) {
      setConflicts(conflictingEvents);
      console.log(conflictingEvents);
      return;
    }

    const eventData = {
      campaign: selectedCampaign,
      venue: selectedVenue,
      team: selectedTeam,
      eventType,
      eventName: (event.target as any).elements.eventName.value,
      preEventInstructions: (event.target as any).elements.preEventInstructions.value,
      whoSchedules: "Specific Date",
      startDateTime,
      durationHours,
      durationMinutes,
      brandAmbassadors,
    };

    try {
      const response = await fetch(`${apiUrl}/events/create`, {
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
    <Box display="flex" flexDirection="column" sx={{ padding: '20px' }}>
      
      {/* Form section with the calendar to the right */}
      <form onSubmit={handleSubmit}>
      <Box display="flex" flexDirection="row" justifyContent="space-between" sx={{ paddingBottom: '20px' }}>
        <Box flex={1} sx={{ paddingRight: '20px' }}>
            <h1 className='title'>Create Event by Calendar</h1>
            <h3 style={{ color: "black", marginBottom: '0px' }}>Campaign</h3>
            <Autocomplete
              options={campaigns}
              value={selectedCampaign}
              onChange={handleCampaignChange}
              renderInput={(params) => <TextField {...params} label="Campaign" fullWidth margin="normal" />}
              isOptionEqualToValue={(option, value) => value === '' || option === value}
            />
            <h3 style={{ color: "black", marginBottom: '0px' }}>Venue</h3>
            <Autocomplete
              options={venues}
              value={selectedVenue}
              onChange={(_event, value) => setSelectedVenue(value ?? '')}
              renderInput={(params) => <TextField {...params} label="Venue" fullWidth margin="normal" />}
              isOptionEqualToValue={(option, value) => value === '' || option === value}
            />
            <h3 style={{ color: "black", marginBottom: '0px' }}>Team</h3>
            <Autocomplete
              options={teams}
              value={selectedTeam}
              onChange={(_event, value) => setSelectedTeam(value ?? '')}
              renderInput={(params) => <TextField {...params} label="Team" fullWidth margin="normal" />}
              isOptionEqualToValue={(option, value) => value === '' || option === value}
            />
            <h3 style={{ color: "black", marginBottom: '0px' }}>Event Name</h3>
            <TextField
              name="eventName"
              label="Event Name"
              fullWidth
              margin="normal"
            />

            {/* Ambassador section */}
            <Box>
              <Divider sx={{ margin: '20px 0' }} />
              <h3 style={{ color: "black", marginBottom: '0px' }}>Brand Ambassadors</h3>
              {/* <Typography variant="h5" sx={{ marginTop: '20px', color: 'black' }}>Brand Ambassadors</Typography> */}
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
              <Button onClick={handleAddBa} variant="contained" color="primary" sx={{ marginTop: '8px' }}>
                Add Brand Ambassador
              </Button>
            </Box>
            
            <Divider sx={{ margin: '20px 0' }} />
            <h3 style={{ color: "black", marginBottom: '0px' }}>Event Type</h3>
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
            <h3 style={{ color: "black", marginBottom: '0px' }}>Event Date/Duration</h3>
            <Box display="flex" gap={2} mt={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Start Date Time"
                  value={startDateTime}
                  onChange={(newValue, _context) => {
                    setStartDateTime(newValue as Dayjs);
                  }}
                />
              </LocalizationProvider>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  label="Hours"
                  value={durationHours}
                  onChange={handleHourChange}
                >
                  {[...Array(24).keys()].map(hour => (
                    <MenuItem key={hour} value={hour}>{hour}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Minutes"
                  value={durationMinutes}
                  onChange={handleMinuteChange}
                >
                  {[...Array(12).keys()].map(i => i * 5).map(minute => (
                    <MenuItem key={minute} value={minute}>{minute}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <h3 style={{ color: "black", marginBottom: '0px' }}>Pre-Event Instructions</h3>
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
        </Box>
  
        {/* Calendar showing events */}
        <Box flex={1} sx={{ paddingLeft: '20px' }}>
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '70vh', width: '100%', color: 'black' }}
            eventPropGetter={eventStyleGetter}
          />
        </Box>
      </Box>
  
      {/* Full width tables and additional info */}
      <Box mt={4}>
        <Divider sx={{ margin: '20px 0' }} />
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
                    <Avatar style={{ marginRight: '10px' }} src={ba.avatar_url} />
                    <Typography variant="subtitle1">{ba.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">${ba.wage.toFixed(2)}/h</Typography>
                </TableCell>
                <TableCell>
                  <Checkbox checked={ba.inventory} onChange={() => handleCheckboxChange(ba.id, 'inventory')} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={ba.qa} onChange={() => handleCheckboxChange(ba.id, 'qa')} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={ba.photos} onChange={() => handleCheckboxChange(ba.id, 'photos')} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={ba.expenses} onChange={() => handleCheckboxChange(ba.id, 'expenses')} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={ba.mileageExpense} onChange={() => handleCheckboxChange(ba.id, 'mileageExpense')} />
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
  
        <Divider sx={{ margin: '20px 0' }} />
  
        {/* Files section */}
        <h3 style={{ color: "black", marginBottom: '0px' }}>Files</h3>
        <Button variant="contained" component="label">
          Select files to upload
          <input type="file" hidden />
        </Button>
  
        <Divider sx={{ margin: '20px 0' }} />
  
        {/* Additional Info section */}
        <h3 style={{ color: "black", marginBottom: '0px' }}>Additional Info</h3>
        <TextField
          label="Sales Rep Notes 2"
          fullWidth
          margin="normal"
        />
        <TextField
          label="Primary Program"
          select
          value={selectedProgram}
          onChange={(event) => setSelectedProgram(event.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Program1">Program1</MenuItem>
          <MenuItem value="Program2">Program2</MenuItem>
        </TextField>
        <TextField
          label="Wholesaler"
          select
          value={selectedWholesaler}
          onChange={(event) => setSelectedWholesaler(event.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Wholesaler1">Wholesaler1</MenuItem>
          <MenuItem value="Wholesaler2">Wholesaler2</MenuItem>
        </TextField>
  
        <Button type="submit" variant="contained" color="primary" sx={{ marginTop: '20px' }}>Create Event</Button>
        

        {conflicts.length > 0 && (
          <Box mt={2} color="red">
            {conflicts.map((conflict, index) => (
              <Typography key={index}>{conflict}</Typography>
            ))}
          </Box>
        )}
      </Box>
      </form>
    </Box>
  );  
};

export default CreateEventCalendar;
