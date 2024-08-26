/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { GoogleMap, LoadScriptNext, Libraries, MarkerF } from '@react-google-maps/api';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';

const libraries: Libraries = ['places'] as const;

type Venue = {
  id?: number;
  name: string;
  address: string;
  region: string;
  comment: string;
  contact1_name: string;
  contact1_phone: string;
  contact2_name: string;
  contact2_phone: string;
  last_time_visited: string;
  teams: string[] | string;
};

const EditVenueForm: React.FC<{ open: boolean; onClose: () => void; fetchVenues: () => void; venueData: Venue | null }> = ({ open, onClose, fetchVenues, venueData }) => {
  const [venue, setVenue] = useState<Venue>(venueData || {
    name: '',
    address: '',
    region: '',
    comment: '',
    contact1_name: '',
    contact1_phone: '',
    contact2_name: '',
    contact2_phone: '',
    last_time_visited: '',
    teams: []
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [teams, setTeams] = useState<string[]>([]);

  useEffect(() => {
    if (open && venueData) {
      const teams: string[] = Array.isArray(venueData.teams)
        ? venueData.teams
        : typeof venueData.teams === 'string'
        ? venueData.teams.split(',')
        : [];
      
      setVenue({ ...venueData, teams });
      updateMapCenterWithAddress(venueData.address);
    } else if (open) {
      fetchTeams();
      getUserLocation();
    }
  }, [open, venueData]);

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

  const handleSelect = async (address: string) => {
    try {
      const results = await geocodeByAddress(address);
      const { lat, lng } = await getLatLng(results[0]);
      setVenue((prevVenue) => ({
        ...prevVenue,
        address
      }));
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const geocoder = new google.maps.Geocoder();
  
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;
          setVenue((prevVenue) => ({
            ...prevVenue,
            address,
          }));
          setMapCenter({ lat, lng });
          setMarkerPosition({ lat, lng });
        } else {
          console.error('Geocode was not successful for the following reason:', status);
        }
      });
    }
  };

  const handleInputChange = (field: keyof Venue, value: any) => {
    setVenue(prevVenue => ({ ...prevVenue, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/venues/updatevenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venue }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchVenues();
      onClose();
    } catch (error) {
      console.error('Error saving venue:', error);
    }
  };

  const updateMapCenterWithAddress = async (address: string) => {
    try {
      const results = await geocodeByAddress(address);
      if (results.length > 0) {
        const { lat, lng } = await getLatLng(results[0]);
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
      }
    } catch (error) {
      console.error('Error updating map center:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Venue</DialogTitle>
      <DialogContent>

        <LoadScriptNext googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} libraries={libraries}>
          <>
            <PlacesAutocomplete value={venue.address} onChange={(address) => handleInputChange('address', address)} onSelect={handleSelect}>
              {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                <div>
                  <TextField
                    fullWidth
                    {...getInputProps({
                      placeholder: 'Enter location',
                      label: 'Address',
                      style: { marginRight: 8, marginTop: 5, width: '100%' }
                    })}
                  />
                  <div>
                    {loading && <div>Loading...</div>}
                    {suggestions.map((suggestion, index) => {
                      const style = {
                        backgroundColor: suggestion.active ? '#41b6e6' : '#fff',
                        cursor: 'pointer',
                      };
                      const props = getSuggestionItemProps(suggestion, { style });

                      return (
                        <div
                          {...props}
                          key={suggestion.placeId || index}
                        >
                          {suggestion.description}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </PlacesAutocomplete>
            <GoogleMap
              center={mapCenter}
              zoom={15}
              mapContainerStyle={{ width: '100%', height: '400px', marginTop: '10px' }}
              onClick={handleMapClick}
            >
              {markerPosition && (
                <MarkerF position={markerPosition} />
              )}
            </GoogleMap>
          </>
        </LoadScriptNext>

        <TextField
          label="Name"
          value={venue.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        
        <Autocomplete
          multiple
          options={teams}
          value={Array.isArray(venue.teams) ? venue.teams : venue.teams ? venue.teams.split(',') : []}
          onChange={(_, value) => handleInputChange('teams', value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Teams"
              style={{ marginRight: 16, marginTop: 10, width: '100%' }}
            />
          )}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            <TextField
              label="Contact 1 Name"
              value={venue.contact1_name}
              onChange={(e) => handleInputChange('contact1_name', e.target.value)}
              style={{ marginRight: 16, marginTop: 10 }}
            />
            <TextField
              label="Contact 1 Phone"
              value={venue.contact1_phone}
              onChange={(e) => handleInputChange('contact1_phone', e.target.value)}
              style={{ marginRight: 16, marginTop: 10 }}
            />
          </div>
          <div style={{ display: 'flex' }}>
            <TextField
              label="Contact 2 Name"
              value={venue.contact2_name}
              onChange={(e) => handleInputChange('contact2_name', e.target.value)}
              style={{ marginRight: 16, marginTop: 10 }}
            />
            <TextField
              label="Contact 2 Phone"
              value={venue.contact2_phone}
              onChange={(e) => handleInputChange('contact2_phone', e.target.value)}
              style={{ marginRight: 16, marginTop: 10 }}
            />
          </div>
        </div>

        <TextField
          label="Comment"
          value={venue.comment}
          onChange={(e) => handleInputChange('comment', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Save</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditVenueForm;
