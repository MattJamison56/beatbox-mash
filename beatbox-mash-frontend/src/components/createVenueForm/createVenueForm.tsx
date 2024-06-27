/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from "lodash"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

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

type AutocompletePrediction = {
  description: string;
  place_id: string;
};

const CreateVenueForm: React.FC<{ open: boolean; onClose: () => void; fetchVenues: () => void }> = ({ open, onClose, fetchVenues }) => {
  const [venue, setVenue] = useState<Venue>({ name: '', address: '', region: '', comment: '', contact1_name: '', contact1_phone: '', contact2_name: '', contact2_phone: '', last_time_visited: '', teams: [] });
  const [teams, setTeams] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [autocompletePredictions, setAutocompletePredictions] = useState<AutocompletePrediction[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

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
        console.log("Set initial marker position:", { lat: latitude, lng: longitude });
      });
    }
  };

  const handleInputChange = useCallback((field: keyof Venue, value: any) => {
    setVenue(prevVenue => ({ ...prevVenue, [field]: value }));
    if (field === 'address') {
      debouncedFetchPredictions(value);
    }
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/venues/createvenue', {
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
      console.error('Error creating venue:', error);
    }
  };

  const updateMapCenter = useCallback((placeId: string) => {
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: placeId, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setMapCenter({ lat, lng });
            setMarkerPosition({ lat, lng });
            console.log("Updated marker position:", { lat, lng });

            const name = place.name || '';
            const formattedName = name ? `${name} - ${place.formatted_address}` : place.formatted_address || '';

            setVenue(prevVenue => ({
              ...prevVenue,
              name: formattedName,
              address: place.formatted_address || '',
            }));
          }
        }
      );
    }
  }, []);

  const debouncedFetchPredictions = useCallback(
    debounce((input: string) => {
      if (autocompleteService.current && input) {
        autocompleteService.current.getPlacePredictions(
          { input },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setAutocompletePredictions(predictions.slice(0, 5));
            }
          }
        );
      }
    }, 300),
    []
  );

  const onMarkerDragEnd = useCallback((_event: google.maps.MapMouseEvent) => {
    console.log('drag end');
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Venue</DialogTitle>
      <DialogContent>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} libraries={libraries}>
      <Autocomplete
        freeSolo
        options={autocompletePredictions}
        getOptionLabel={(option) => (option as AutocompletePrediction).description}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Address"
            value={venue.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            style={{ marginRight: 8, marginTop: 5, width: '100%' }}
          />
        )}
        onChange={(_, value) => {
          const selectedOption = value as AutocompletePrediction;
          if (selectedOption) {
            updateMapCenter(selectedOption.place_id);
          }
        }}
      />
          <GoogleMap
            center={mapCenter}
            zoom={15}
            mapContainerStyle={{ width: '100%', height: '400px', marginTop: '10px' }}
             onClick={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setMarkerPosition({ lat, lng });
                setMapCenter({ lat, lng });

                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                  if (status === 'OK' && results && results[0]) {
                    const address = results[0].formatted_address;
                    
                    const name = results[0].address_components.find(component => component.types.includes('point_of_interest'))?.long_name || '';
                    const city = results[0].address_components.find(component => component.types.includes('locality'))?.long_name || '';
                    const formattedName = name && city ? `${name} - ${city}` : address;
                    
                    setVenue(prevVenue => ({
                      ...prevVenue,
                      address: address,
                      name: formattedName
                    }));
                  }
                });
              }
            }}
            onLoad={(map) => {
              placesService.current = new google.maps.places.PlacesService(map);
              autocompleteService.current = new google.maps.places.AutocompleteService();
              setIsMapLoaded(true);
            }}
          >
            {isMapLoaded && markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={onMarkerDragEnd}
              />
            )}
          </GoogleMap>
        </LoadScript>
        <TextField
          label="Name"
          value={venue.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
            <Autocomplete
              multiple
              options={teams}
              value={venue.teams}
              onChange={(_, value) => handleInputChange('teams', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Teams"
                  style={{ marginRight: 16, width: '100%', marginTop: 10 }}
                />
              )}
            />
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div style={{display: 'flex'}}>
                <TextField
                  label="Contact 1 Name"
                  value={venue.contact1_phone}
                  onChange={(e) => handleInputChange('contact1_phone', e.target.value)}
                  style={{ marginRight: 16, marginTop: 10 }}
                />
                <TextField
                  label="Contact 1 Phone"
                  value={venue.contact1_phone}
                  onChange={(e) => handleInputChange('contact1_phone', e.target.value)}
                  style={{ marginRight: 16, marginTop: 10 }}
                />
              </div>
              <div style={{display: 'flex'}}>
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
              label="Last Time Visited"
              type="datetime-local"
              value={venue.last_time_visited}
              onChange={(e) => handleInputChange('last_time_visited', e.target.value)}
              InputLabelProps={{ shrink: true }}
              style={{ marginRight: 16, marginTop: 20 }}
            />
            <TextField
              label="Comment"
              value={venue.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              style={{ marginRight: 16, marginTop: 20 }}
            />
            
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Save</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateVenueForm;