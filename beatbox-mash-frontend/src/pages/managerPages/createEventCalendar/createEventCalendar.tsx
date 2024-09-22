/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  TextField, Button, MenuItem, Typography, Box, Checkbox, Autocomplete, Divider,
  Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, IconButton, Table, TableBody,
  TableCell, TableHead, TableRow, Avatar, Menu
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

const localizer = momentLocalizer(moment); // Initialize localizer for Calendar

const apiUrl = import.meta.env.VITE_API_URL;

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
  avatar_url?: string;
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
  const [whoSchedules, setWhoSchedules] = useState('Specific Date');
  const [events, setEvents] = useState<Event[]>([]);

  // Fetching data (campaigns, venues, brand ambassadors)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaignsResponse = await fetch(`${apiUrl}/campaigns`);
        const venuesResponse = await fetch(`${apiUrl}/venues`);
        const basResponse = await fetch(`${apiUrl}/ambassadors/getAmbassadors`);
        const campaignsData = await campaignsResponse.json();
        const venuesData = await venuesResponse.json();
        const basData = await basResponse.json();

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
      setBrandAmbassadors((prev) => [...prev, selectedBa]);
      setSelectedBa(null);
    }
  };

  const handleCampaignChange = async (_event: React.ChangeEvent<{}>, value: string | null) => {
    setSelectedCampaign(value ?? '');
    // Fetch additional campaign details if needed
  };

  // Fetching calendar events related to selected brand ambassadors and venues
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${apiUrl}/events/eventswithambassadors`);
        const data = await response.json();
        setEvents(data); // Assume events contain ambassadors and venue details
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, [brandAmbassadors, selectedVenue]);

  const eventStyleGetter = (event: Event) => {
    // Style based on event status and ambassador availability
    let borderColor = "#3174ad"; // Default color
    if (event.eventStatus === 'Upcoming') {
      borderColor = event.acceptedAmbassadorsCount > 0 ? "#32CD32" : "#FFA500";
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

  return (
    <Box display="flex" flexDirection="row" justifyContent="space-between" sx={{ padding: '20px' }}>
      <Box flex={1} sx={{ paddingRight: '20px' }}>
        {/* Event Creation Form */}
        <form onSubmit={() => {/* Add form submission logic */}}>
          <h1 className="title">Create Event by Calendar</h1>
          <Autocomplete
            options={campaigns}
            value={selectedCampaign}
            onChange={handleCampaignChange}
            renderInput={(params) => <TextField {...params} label="Campaign" fullWidth margin="normal" />}
          />
          <Autocomplete
            options={venues}
            value={selectedVenue}
            onChange={(_event, value) => setSelectedVenue(value ?? '')}
            renderInput={(params) => <TextField {...params} label="Venue" fullWidth margin="normal" />}
          />
          <TextField
            name="eventName"
            label="Event Name"
            fullWidth
            margin="normal"
          />
          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Who Schedules?</FormLabel>
            <RadioGroup row aria-label="whoSchedules" name="whoSchedules" value={whoSchedules} onChange={(e) => setWhoSchedules(e.target.value)}>
              <FormControlLabel value="Specific Date" control={<Radio />} label="Specific Date" />
              <FormControlLabel value="Brand Ambassador" control={<Radio />} label="Brand Ambassador" />
            </RadioGroup>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Start Date Time"
              value={startDateTime}
              onChange={setStartDateTime}
            />
          </LocalizationProvider>
          <Box display="flex" gap={2} mt={2}>
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
          <Button type="submit" variant="contained" color="primary" sx={{ marginTop: '20px' }}>Create Event</Button>
        </form>
      </Box>

      {/* Calendar showing events with selected brand ambassadors and venues */}
      <Box flex={1}>
        <h1 className="title">Calendar of Events</h1>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh', width: '100%', color: 'black' }}
          eventPropGetter={eventStyleGetter}
        />
      </Box>
    </Box>
  );
};

export default CreateEventCalendar;
