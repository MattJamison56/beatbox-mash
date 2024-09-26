/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

// Need to fix UTC and local time issues

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box
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
import timezone from 'dayjs/plugin/timezone';

const apiUrl = import.meta.env.VITE_API_URL;

dayjs.extend(utc);
dayjs.extend(timezone);

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

  const [timeRanges, setTimeRanges] = useState<
    { startTime: Dayjs | null; endTime: Dayjs | null }[]
  >([{ startTime: null, endTime: null }]);

  const currentMonthRef = useRef(dayjs());

  useEffect(() => {
    if (open && userId) {
      fetchAvailability();
    }
  }, [open, userId]);

  // In the fetchAvailability function, ensure fetched UTC dates are converted to local:
  const fetchAvailability = async () => {
    setLoading(true);
    try {
      console.log("Fetching availability data from server...");
      const response = await fetch(`${apiUrl}/users/${userId}/availability`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch availability: ${response.status} ${response.statusText}`
        );
      }

      const data: EventInput[] = await response.json();
      console.log("Received availability data from server:", data);

      const parsedData = data.map((event) => {
        // @ts-ignore
        const startUtc = dayjs.utc(event.start);  // Start time in UTC
        // @ts-ignore
        const endUtc = dayjs.utc(event.end);      // End time in UTC

        const startLocal = startUtc.local();  // Convert to local time for display
        const endLocal = endUtc.local();      // Convert to local time for display

        let title = event.title;
        if (!title) {
          if (event.allDay) {
            title = 'Available All Day';
          } else {
            title = `${startLocal.format('h:mm A')} - ${endLocal.format('h:mm A')}`;
          }
        }

        return {
          ...event,
          start: startLocal.toDate(),  // Display local time
          end: endLocal.toDate(),      // Display local time
          className: 'availability-event',
          backgroundColor: 'lightgreen',
          borderColor: 'lightgreen',
          display: event.allDay ? 'background' : 'auto',
          title,
        };
      });

      setAvailability(parsedData);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
    setLoading(false);
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    if (!arg.start) return;

    try {
      const selectedDateUtc = dayjs(arg.start).startOf('day').utc();
      const currentDateUtc = dayjs.utc().startOf('day');

      if (selectedDateUtc.isAfter(currentDateUtc, 'month')) {
        const dateStr = selectedDateUtc.format('YYYY-MM-DD');

        const existingEvents = availability.filter((event) => {
          if (!event.start) return false;
          // @ts-ignore
          const eventStart = dayjs.utc(event.start).startOf('day');
          const eventDateStr = eventStart.format('YYYY-MM-DD');
          return eventDateStr === dateStr;
        });

        if (existingEvents.length === 0) {
          const endDateUtc = selectedDateUtc.add(1, 'day');
          setAvailability((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              start: selectedDateUtc.toISOString(),
              end: endDateUtc.toISOString(),
              allDay: true,
              display: 'background',
              backgroundColor: 'lightgreen',
              borderColor: 'lightgreen',
              className: 'availability-event',
            },
          ]);
        } else {
          setSelectedDate(selectedDateUtc);
          setAvailabilityOptionsOpen(true);
        }
      } else {
        alert('You can only add availability in future months.');
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

  const handleSetTimeSpecificAvailability = () => {
    setTimeDialogOpen(true);
    setAvailabilityOptionsOpen(false);
  };

  const handleRemoveAvailability = () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.utc().format('YYYY-MM-DD');

    setAvailability((prev) =>
      prev.filter((event) => {
        if (!event.start) return true;
        // @ts-ignore
        const eventStartUtc = dayjs(event.start).utc().startOf('day');
        const eventDateStr = eventStartUtc.format('YYYY-MM-DD');
        return eventDateStr !== dateStr;
      })
    );
    setAvailabilityOptionsOpen(false);
  };

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

  const handleAddTimeRange = () => {
    setTimeRanges((prev) => [...prev, { startTime: null, endTime: null }]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setTimeRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeSave = () => {
    if (!selectedDate) {
      alert('No date selected.');
      return;
    }
  
    // Work with local time for display and convert to UTC for storage
    const selectedDateLocal = dayjs(selectedDate).local(); 
    console.log("Selected Date (Local):", selectedDateLocal.format());
  
    const selectedDateUtc = selectedDateLocal.utc();
    console.log("Selected Date (UTC):", selectedDateUtc.format());
  
    // Remove existing availability for the date
    setAvailability((prev) =>
      prev.filter((event) => {
        if (!event.start) return true;
        // @ts-ignore
        const eventStartUtc = dayjs(event.start).utc().startOf('day');
        const eventDateStr = eventStartUtc.format('YYYY-MM-DD');
        const selectedDateStr = selectedDateUtc.format('YYYY-MM-DD');
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
  
        // Local times based on user input
        const startDateTimeLocal = selectedDateLocal
          .hour(startTime.hour())
          .minute(startTime.minute())
          .second(0)
          .millisecond(0);
        console.log("Start DateTime (Local):", startDateTimeLocal.format());
  
        const endDateTimeLocal = selectedDateLocal
          .hour(endTime.hour())
          .minute(endTime.minute())
          .second(0)
          .millisecond(0);
        console.log("End DateTime (Local):", endDateTimeLocal.format());
  
        // Convert to UTC for storage
        const startDateTimeUtc = startDateTimeLocal.utc();
        const endDateTimeUtc = endDateTimeLocal.utc();
        console.log("Start DateTime (UTC):", startDateTimeUtc.format());
        console.log("End DateTime (UTC):", endDateTimeUtc.format());
  
        // Store UTC times, but display local times
        newEvents.push({
          id: Date.now().toString() + Math.random(),
          start: startDateTimeUtc.toISOString(), // Store in UTC
          end: endDateTimeUtc.toISOString(),     // Store in UTC
          allDay: false,
          display: 'block',
          backgroundColor: 'lightgreen',
          borderColor: 'lightgreen',
          className: 'availability-event',
          textColor: 'black',
          title: `${startDateTimeLocal.format('h:mm A')} - ${endDateTimeLocal.format('h:mm A')}`, // Display local time
        });
      } else {
        alert('Please select both start and end times for all time ranges.');
        return;
      }
    }
  
    console.log("New events to be saved:", newEvents);
    setAvailability((prev) => [...prev, ...newEvents]);
  
    setTimeDialogOpen(false);
    setSelectedDate(null);
    setTimeRanges([{ startTime: null, endTime: null }]);
  };  

  const handleDatesSet = (arg: DatesSetArg) => {
    currentMonthRef.current = dayjs(arg.start);
  };

  const selectAllow = (selectInfo: DateSelectArg) => {
    const selectedDateUtc = dayjs(selectInfo.start).startOf('day').utc();
    const currentDateUtc = dayjs().startOf('day').utc();
    return selectedDateUtc.isAfter(currentDateUtc, 'month');
  };

  const eventAllow = (dropInfo: any, draggedEvent: any) => {
    const eventStart = dayjs(draggedEvent.start).startOf('day');
    const currentDate = dayjs().startOf('day');
    return eventStart.isAfter(currentDate, 'month');
  };

  const parseDate = (dateInput: any): Date | null => {
    if (!dateInput) {
      console.error('Invalid date input:', dateInput);
      return null;
    }

    const date = dayjs.utc(dateInput);
    if (!date.isValid()) {
      console.error('Invalid date input:', dateInput);
      return null;
    }
    return date.toDate();
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const eventStartLocal = dayjs(eventInfo.event.start).local().format('h:mm A');
    const eventEndLocal = dayjs(eventInfo.event.end).local().format('h:mm A');

    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky">
            {`${eventStartLocal} - ${eventEndLocal}`}
          </div>
        </div>
      </div>
    );
  };

  const calendarStyles = `
    .fc-event {
      border: none;
    }

    .fc-daygrid-day-frame {
      position: relative;
    }

    .availability-event.fc-daygrid-block-event.fc-event-today, 
    .availability-event.fc-daygrid-block-event.fc-event {
      background-color: lightgreen !important;
      border: none !important;
      color: black !important;
    }

    .availability-event {
      background-color: lightgreen !important;
      border: none !important;
      textColor: black !important;
    }

    .fc-header-title {
      textColor: black;
    }

    .availability-event.past-event {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  const saveAvailability = async () => {
    setLoading(true);
    try {
      const availabilityData = availability.map((event) => ({
        id: event.id,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
      }));

      console.log("Saving availability data to server:", availabilityData);

      const response = await fetch(`${apiUrl}/users/${userId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availabilityData),
      });

      if (response.ok) {
        console.log("Successfully saved availability data.");
      } else {
        console.error('Failed to save availability:', response.statusText);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving availability:', error);
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
              editable={true}
              eventStartEditable={true}
              eventDurationEditable={true}
              eventAllow={eventAllow}
              validRange={{
                start: DateTime.now().minus({ months: 1 }).startOf('month').toISODate(),
                end: DateTime.now().plus({ months: 3 }).endOf('month').toISODate(),
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
