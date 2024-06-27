/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete as MuiAutocomplete, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

type Venue = {
  name: string;
  address: string;
  region: string;
  comment: string;
  contact1_name: string;
  contact1_phone: string;
  contact2_name: string;
  contact2_phone: string;
  last_time_visited: string;
  teams: string[];
};

const CreateVenueForm: React.FC<{ open: boolean, onClose: () => void, fetchVenues: () => void }> = ({ open, onClose, fetchVenues }) => {
  const [venues, setVenues] = useState<Venue[]>([{ name: '', address: '', region: '', comment: '', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', last_time_visited: '', teams: [] }]);
  const [teams, setTeams] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number }>({ lat: 0, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number, lng: number }>({ lat: 0, lng: 0 });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (open) {
      fetchTeams();
      getUserLocation();
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

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setMarkerPosition({ lat: latitude, lng: longitude });
      });
    }
  };

  const handleAddMore = () => {
    setVenues([...venues, { name: '', address: '', region: '', comment: '', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', last_time_visited: '', teams: [] }]);
  };

  const handleInputChange = (index: number, field: keyof Venue, value: any) => {
    const newVenues = [...venues];
    newVenues[index][field] = value;
    setVenues(newVenues);
    if (field === 'address' && value) {
      updateMapCenter(value, index);
    }
  };

  const handleDeleteRow = (index: number) => {
    const newVenues = venues.filter((_, i) => i !== index);
    setVenues(newVenues);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/venues/createvenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venues }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchVenues(); // updates table
      onClose();
    } catch (error) {
      console.error('Error creating venues:', error);
    }
  };

  const updateMapCenter = (address: string, index: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMarkerPosition({ lat: location.lat(), lng: location.lng() });
        
        // Extract name and city
        const name = results[0].address_components.find(component => component.types.includes('point_of_interest'))?.long_name || '';
        const city = results[0].address_components.find(component => component.types.includes('locality'))?.long_name || '';
        const formattedName = name && city ? `${name} - ${city}` : results[0].formatted_address;
        
        handleInputChange(index, 'name', formattedName);
        handleInputChange(index, 'address', results[0].formatted_address);
      }
    });
  };

  const onMarkerDragEnd = (event: google.maps.MapMouseEvent, index: number) => {
    const lat = event.latLng!.lat();
    const lng = event.latLng!.lng();
    setMarkerPosition({ lat, lng });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        
        // Extract name and city
        const name = results[0].address_components.find(component => component.types.includes('point_of_interest'))?.long_name || '';
        const city = results[0].address_components.find(component => component.types.includes('locality'))?.long_name || '';
        const formattedName = name && city ? `${name} - ${city}` : address;
        
        handleInputChange(index, 'address', address);
        handleInputChange(index, 'name', formattedName);
      }
    });
  };

  const handlePlaceSelect = (index: number) => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
      
      // Extract name and city
      const name = place.name || '';
      const city = place.address_components?.find(component => component.types.includes('locality'))?.long_name || '';
      const formattedName = name && city ? `${name} - ${city}` : place.formatted_address || '';
      
      handleInputChange(index, 'address', place.formatted_address || '');
      handleInputChange(index, 'name', formattedName);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Venues</DialogTitle>
      <DialogContent>
        {venues.map((venue, index) => (
          <div key={index} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} libraries={['places']}>
              <TextField
                label="Address"
                value={venue.address}
                onChange={(e) => handleInputChange(index, 'address', e.target.value)}
                style={{ marginRight: 8, marginTop: 5, width: '100%' }}
                inputProps={{
                  ref: (input: HTMLInputElement | null) => {
                    if (input && !autocompleteRef.current) {
                      autocompleteRef.current = new google.maps.places.Autocomplete(input);
                      autocompleteRef.current.addListener('place_changed', () => handlePlaceSelect(index));
                    }
                  },
                }}
              />
              <GoogleMap
                center={mapCenter}
                zoom={15}
                mapContainerStyle={{ width: '100%', height: '400px', marginTop: '10px' }}
                onClick={(e) => {
                  if (e.latLng) {
                    setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    onMarkerDragEnd(e, index);
                  }
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      onMarkerDragEnd(e, index);
                    }
                  }}
                />
              </GoogleMap>
            </LoadScript>
            <TextField
              label="Name"
              value={venue.name}
              onChange={(e) => handleInputChange(index, 'name', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Region"
              value={venue.region}
              onChange={(e) => handleInputChange(index, 'region', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Comment"
              value={venue.comment}
              onChange={(e) => handleInputChange(index, 'comment', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Contact 1 Name"
              value={venue.contact1_name}
              onChange={(e) => handleInputChange(index, 'contact1_name', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Contact 1 Phone"
              value={venue.contact1_phone}
              onChange={(e) => handleInputChange(index, 'contact1_phone', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Contact 2 Name"
              value={venue.contact2_name}
              onChange={(e) => handleInputChange(index, 'contact2_name', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Contact 2 Phone"
              value={venue.contact2_phone}
              onChange={(e) => handleInputChange(index, 'contact2_phone', e.target.value)}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <TextField
              label="Last Time Visited"
              type="datetime-local"
              value={venue.last_time_visited}
              onChange={(e) => handleInputChange(index, 'last_time_visited', e.target.value)}
              InputLabelProps={{ shrink: true }}
              style={{ marginRight: 8, marginTop: 5 }}
            />
            <MuiAutocomplete
              multiple
              options={teams}
              value={venue.teams}
              onChange={(_e, value) => handleInputChange(index, 'teams', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Teams"
                  style={{ marginRight: 8, minWidth: 200, marginTop: 5 }}
                />
              )}
            />
            {venues.length > 1 && (
              <IconButton onClick={() => handleDeleteRow(index)}>
                <DeleteIcon />
              </IconButton>
            )}
          </div>
        ))}
        <Button onClick={handleAddMore}>Add More</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Save</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateVenueForm;