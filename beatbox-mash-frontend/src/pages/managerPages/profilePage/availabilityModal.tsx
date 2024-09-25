/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  TextField,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import {
  DateSelectArg,
  EventInput,
  DatesSetArg,
  EventContentArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DateTime } from 'luxon';
import {
  TimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

dayjs.extend(utc);

interface AvailabilityModalProps {
  open: boolean;
  handleClose: () => void;
  userId?: number;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  open,
  handleClose,
  userId,
}) => {
  const [availability, setAvailability] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [availabilityOptionsOpen, setAvailabilityOptionsOpen] =
    useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    null
  );

  // New state for multiple time ranges
  const [timeRanges, setTimeRanges] = useState<
    { startTime: Dayjs | null; endTime: Dayjs | null }[]
  >([{ startTime: null, endTime: null }]);

  // UseRef for currentMonth to prevent infinite loops
  const currentMonthRef = useRef(dayjs());

  // Fetch availability data when modal opens
  useEffect(() => {
    if (open && userId) {
      fetchAvailability();
    }
  }, [open, userId]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/availability`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch availability: ${response.status} ${response.statusText}`
        );
      }
      const data: EventInput[] = await response.json();
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Optionally, handle the error in the UI
    }
    setLoading(false);
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    if (!arg.start) return; // Ensure arg.start is defined

    const dateStr = dayjs(arg.start).format('YYYY-MM-DD');
    const existingEvents = availability.filter((event) => {
      if (!event.start) return false; // Ensure event.start is defined

      // Type assertion to acceptable type for dayjs()
      const eventStart = event.start as string | number | Date | Dayjs;
      const eventDateStr = dayjs(eventStart).format('YYYY-MM-DD');
      return eventDateStr === dateStr;
    });

    if (existingEvents.length === 0) {
      // First click: Set date as available all day and light up square
      const endDateStr = dayjs(dateStr).add(1, 'day').format('YYYY-MM-DD');
      setAvailability((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          start: dateStr,
          end: endDateStr,
          allDay: true,
          display: 'background',
          backgroundColor: 'lightgreen',
          borderColor: 'lightgreen',
          className: 'availability-event',
        },
      ]);
    } else {
      // Second click: Open modal with options
      setSelectedDate(dayjs(arg.start));
      setAvailabilityOptionsOpen(true);
    }
  };

  const handleSetTimeSpecificAvailability = () => {
    setTimeDialogOpen(true);
    setAvailabilityOptionsOpen(false);
  };

  const handleRemoveAvailability = () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.format('YYYY-MM-DD');

    // Remove availability for the date
    setAvailability((prev) =>
      prev.filter((event) => {
        if (!event.start) return true; // Keep event if no start date

        const eventStart = event.start as string | number | Date | Dayjs;
        const eventDateStr = dayjs(eventStart).format('YYYY-MM-DD');
        return eventDateStr !== dateStr;
      })
    );
    setAvailabilityOptionsOpen(false);
  };

  // Handle changes in time ranges
  const handleTimeRangeChange = (
    index: number,
    field: 'startTime' | 'endTime',
    newValue: Dayjs | null
  ) => {
    setTimeRanges((prev) => {
      const updated = [...prev];
      updated[index][field] = newValue;
      return updated;
    });
  };

  // Add a new time range
  const handleAddTimeRange = () => {
    setTimeRanges((prev) => [...prev, { startTime: null, endTime: null }]);
  };

  // Remove a time range
  const handleRemoveTimeRange = (index: number) => {
    setTimeRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeSave = () => {
    if (!selectedDate) {
      alert('No date selected.');
      return;
    }

    const selectedDateStr = selectedDate.format('YYYY-MM-DD');

    // Remove existing availability for the date
    setAvailability((prev) =>
      prev.filter((event) => {
        if (!event.start) return true;

        const eventStart = event.start as string | number | Date | Dayjs;
        const eventDateStr = dayjs(eventStart).format('YYYY-MM-DD');
        return eventDateStr !== selectedDateStr;
      })
    );

    const newEvents: EventInput[] = [];

    for (const range of timeRanges) {
      const { startTime, endTime } = range;
      if (startTime && endTime) {
        if (endTime.isBefore(startTime)) {
          alert('End time must be after start time.');
          return;
        }

        const startDateTime = selectedDate
          .hour(startTime.hour())
          .minute(startTime.minute())
          .second(0)
          .millisecond(0);

        const endDateTime = selectedDate
          .hour(endTime.hour())
          .minute(endTime.minute())
          .second(0)
          .millisecond(0);

        newEvents.push({
          id: Date.now().toString() + Math.random(),
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          allDay: false,
          display: 'block',
          backgroundColor: 'lightgreen',
          borderColor: 'lightgreen',
          className: 'availability-event',
          title: `${startDateTime.format('h:mm A')} - ${endDateTime.format('h:mm A')}`,
        });
      } else {
        alert('Please select both start and end times for all time ranges.');
        return;
      }
    }

    setAvailability((prev) => [...prev, ...newEvents]);

    setTimeDialogOpen(false);
    setSelectedDate(null);
    setTimeRanges([{ startTime: null, endTime: null }]);
  };

  // Update the current month when the calendar view changes
  const handleDatesSet = (arg: DatesSetArg) => {
    currentMonthRef.current = dayjs(arg.start);
  };

  // Prevent selection of days not in the current month
  const selectAllow = (selectInfo: DateSelectArg) => {
    const selectedDate = dayjs(selectInfo.start);
    return (
      selectedDate.month() === currentMonthRef.current.month() &&
      selectedDate.year() === currentMonthRef.current.year()
    );
  };

  // Render event content
  const renderEventContent = (eventInfo: EventContentArg) => {
    if (eventInfo.event.allDay) {
      return null;
    }

    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
        </div>
      </div>
    );
  };

  // CSS styles for the calendar and availability events
  const calendarStyles = `
    /* Remove default event styles for background events */
    .fc-event {
      border: none;
    }

    /* Style for day cells */
    .fc-daygrid-day-frame {
      position: relative;
    }

    /* Make availability events fill the day cell for all-day events */
    .availability-event.fc-daygrid-block-event.fc-event-today, 
    .availability-event.fc-daygrid-block-event.fc-event {
      background-color: lightgreen !important;
      border: none !important;
      color: black;
    }

    /* Style for time-specific events */
    .availability-event {
      background-color: lightgreen !important;
      border: none !important;
      color: black;
    }
  `;

  // Save availability to backend
  const saveAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availability),
      });
      if (!response.ok) {
        throw new Error('Failed to save availability');
      }
      handleClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      // Optionally, handle the error in the UI
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <style>{calendarStyles}</style>
      <DialogTitle>Set Your Availability</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box style={{ width: '80%' }}>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              selectable={true}
              select={handleDateSelect}
              selectAllow={selectAllow}
              datesSet={handleDatesSet}
              events={availability}
              eventContent={renderEventContent}
              timeZone="local"
              eventDisplay="auto"
              validRange={{
                start: DateTime.now().plus({ weeks: 2 }).startOf('month').toISODate(),
                end: DateTime.now().plus({ months: 2 }).endOf('month').toISODate(),
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button onClick={handleClose} color="secondary">
          Close
        </Button>
        <Button onClick={saveAvailability} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>

      {/* Availability Options Modal */}
      {availabilityOptionsOpen && (
        <Dialog
          open={availabilityOptionsOpen}
          onClose={() => setAvailabilityOptionsOpen(false)}
        >
          <DialogTitle>Manage Availability</DialogTitle>
          <DialogContent>
            <Button
              onClick={handleSetTimeSpecificAvailability}
              color="primary"
              variant="contained"
              fullWidth
              style={{ marginBottom: '10px' }}
            >
              Set Time-Specific Availability
            </Button>
            <Button
              onClick={handleRemoveAvailability}
              color="secondary"
              variant="contained"
              fullWidth
            >
              Cancel Availability
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Time Selection Modal */}
      {timeDialogOpen && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)}>
            <DialogTitle>Select Availability Times</DialogTitle>
            <DialogContent>
              {timeRanges.map((range, index) => (
                <Box key={index} display="flex" alignItems="center" marginBottom={2}>
                  <TimePicker
                    label="Start Time"
                    value={range.startTime}
                    onChange={(newValue) =>
                      handleTimeRangeChange(index, 'startTime', newValue)
                    }
                  />
                  <TimePicker
                    label="End Time"
                    value={range.endTime}
                    onChange={(newValue) =>
                      handleTimeRangeChange(index, 'endTime', newValue)
                    }
                  />
                  {timeRanges.length > 1 && (
                    <Button
                      onClick={() => handleRemoveTimeRange(index)}
                      color="secondary"
                      variant="outlined"
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
              <Button onClick={handleAddTimeRange} color="primary" variant="contained">
                Add More
              </Button>
            </DialogContent>
            <DialogActions style={{ justifyContent: 'center' }}>
              <Button onClick={() => setTimeDialogOpen(false)} color="secondary">
                Cancel
              </Button>
              <Button onClick={handleTimeSave} color="primary" variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </LocalizationProvider>
      )}
    </Dialog>
  );
};

export default AvailabilityModal;
