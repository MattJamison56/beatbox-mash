import React, { useState, useEffect } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton, CircularProgress, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { GoogleMap, LoadScriptNext, DirectionsRenderer, Libraries } from '@react-google-maps/api';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import { v4 as uuidv4 } from 'uuid';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '97%',
  height: '95%',
  maxHeight: '100vh',
  maxWidth: '100vw',
  overflow: 'auto',
  bgcolor: 'background.paper',
  p: 4,
  outline: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FCFCFC',
};

interface MileageFormProps {
  open: boolean;
  eventId: number;
  handleClose: () => void;
}

interface Location {
  id: string;
  address: string;
  lat: number;
  lng: number;
}

const libraries: Libraries = ['places'];

const MileageForm: React.FC<MileageFormProps> = ({ open, handleClose, eventId }) => {
  const [locations, setLocations] = useState<Location[]>([{ id: uuidv4(), address: '', lat: 0, lng: 0 }]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mileageInput, setMileageInput] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (mileageInput > 30) {
      setFee((mileageInput - 30) * 0.67);
    } else {
      setFee(0);
    }
  }, [mileageInput]);

  const addLocation = () => {
    setLocations([...locations, { id: uuidv4(), address: '', lat: 0, lng: 0 }]);
  };

  const removeLocation = (id: string) => {
    const newLocations = locations.filter(location => location.id !== id);
    setLocations(newLocations);
    if (newLocations.length > 1) {
      calculateDistance(newLocations);
    } else {
      setDirections(null);
      setMileageInput(0);
    }
  };

  const handleSelect = async (address: string, index: number) => {
    try {
      const results = await geocodeByAddress(address);
      const { lat, lng } = await getLatLng(results[0]);
      const newLocations = [...locations];
      newLocations[index] = { ...newLocations[index], address, lat, lng };
      setLocations(newLocations);
      if (newLocations.length > 1) {
        calculateDistance(newLocations);
      }
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const calculateDistance = (locations: Location[]) => {
    if (locations.length < 2 || locations.some(location => location.lat === 0 || location.lng === 0)) {
      return;
    }

    setIsLoading(true);

    const waypoints = locations.slice(1, -1).map(location => ({
      location: { lat: location.lat, lng: location.lng },
      stopover: true,
    }));

    const origin = { lat: locations[0].lat, lng: locations[0].lng };
    const destination = { lat: locations[locations.length - 1].lat, lng: locations[locations.length - 1].lng };

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
          const distanceInMiles = totalDistance * 0.000621371; // Convert meters to miles
          setMileageInput(distanceInMiles);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
        setIsLoading(false);
      }
    );
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('eventId', String(eventId));
    formData.append('totalMileage', String(mileageInput));
    formData.append('totalFee', String(fee));
    formData.append('category', category);
    formData.append('notes', notes);
    formData.append('locations', JSON.stringify(locations));
  
    try {
      const response = await fetch('http://localhost:5000/reports/mileage', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      console.log('Data successfully submitted');
      handleClose();
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
    }
  };
  

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="mileage-form-modal-title" aria-describedby="mileage-form-modal-description">
      <Paper sx={modalStyle}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography variant="h5">Add Mileage</Typography>
          <IconButton onClick={handleClose} aria-label="close" style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <LoadScriptNext googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} libraries={libraries}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2} sx={{ width: '100%' }}>
            <GoogleMap
              mapContainerStyle={{ height: '400px', width: '100%' }}
              zoom={8}
              center={{ lat: 37.7749, lng: -122.4194 }}
            >
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
            {locations.map((location, index) => (
              <Box key={location.id} display="flex" alignItems="center" mb={2} sx={{ width: '100%' }}>
                <LocationInput
                  label={`Location ${index + 1}`}
                  value={location.address}
                  onChange={(address) => handleSelect(address, index)}
                />
                {locations.length > 1 && (
                  <IconButton onClick={() => removeLocation(location.id)} aria-label="delete">
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </LoadScriptNext>

        <Button variant="outlined" onClick={addLocation}>Add Location</Button>

        <Box display="flex" flexDirection="column" alignItems="center" mb={2} sx={{ width: '100%', margin: '20px'}}>
          <TextField
            label="Miles"
            value={mileageInput}
            onChange={(e) => setMileageInput(parseFloat(e.target.value))}
            type="number"
            sx={{ mb: 2 }}
          />
          <Typography variant="h6">Fee: ${fee.toFixed(2)}</Typography>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" mb={2} sx={{ width: '100%' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as string)}
            >
              <MenuItem value="Festival Per Diem">Festival Per Diem</MenuItem>
              <MenuItem value="Ice">Ice</MenuItem>
              <MenuItem value="Off Premise Product Receipt">Off Premise Product Receipt</MenuItem>
              <MenuItem value="On Premise Product Receipt">On Premise Product Receipt</MenuItem>
              <MenuItem value="Parking">Parking</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Box>

        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, marginTop: '0px', maxWidth: '100px', alignSelf: 'center' }}>
          {isLoading ? <CircularProgress size={24} /> : 'Save and Close'}
        </Button>

      </Paper>
    </Modal>
  );
};

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (address: string) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ label, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  const handleSelect = async (address: string) => {
    setInputValue(address);
    onChange(address);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1">{label}</Typography>
      <PlacesAutocomplete value={inputValue} onChange={setInputValue} onSelect={handleSelect}>
        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
          <div>
            <TextField
              fullWidth
              {...getInputProps({
                placeholder: 'Enter location',
              })}
            />
            <div>
              {loading && <div>Loading...</div>}
              {suggestions.map((suggestion) => {
                const style = {
                  backgroundColor: suggestion.active ? '#41b6e6' : '#fff',
                };
                return (
                  <div {...getSuggestionItemProps(suggestion, { style })}>
                    {suggestion.description}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PlacesAutocomplete>
    </Box>
  );
};

export default MileageForm;
