/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { debounce } from "lodash";
// import { JSX } from 'react/jsx-runtime';
import { Dayjs } from 'dayjs';

const libraries: ("places")[] = ["places"];

type AutocompletePrediction = {
  description: string;
  place_id: string;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  age?: string;
  height?: string;
  shirt_size?: string;
  hair_color?: string;
  gender?: string;
  primary_language?: string;
  secondary_language?: string;
  address?: string;
  availability?: Record<string, { start: Dayjs | null, end: Dayjs | null }[]>;
};

interface EditProfileFormProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  fetchUserProfile: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ open, onClose, userProfile: initialProfile, fetchUserProfile }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile || {
    id: 0,
    name: '',
    email: '',
    role: '',
    age: '',
    height: '',
    shirt_size: '',
    hair_color: '',
    gender: '',
    primary_language: '',
    secondary_language: '',
    address: '',
    availability: {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    },
  });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [autocompletePredictions, setAutocompletePredictions] = useState<AutocompletePrediction[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const autocompleteService = React.useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = React.useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (open) {
      if (initialProfile) {
        setUserProfile({
          ...initialProfile,
          availability: initialProfile.availability || {
            Sunday: [],
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          },
        });
      }
      getUserLocation();
    }
  }, [open, initialProfile]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        setMarkerPosition({ lat: latitude, lng: longitude });
      });
    }
  };

  const handleInputChange = React.useCallback((field: keyof UserProfile, value: any) => {
    setUserProfile(prevProfile => ({ ...prevProfile, [field]: value }));
    if (field === 'address') {
      debouncedFetchPredictions(value);
    }
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/account/save-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userProfile),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      fetchUserProfile();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  

  const updateMapCenter = React.useCallback((placeId: string) => {
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setMapCenter({ lat, lng });
            setMarkerPosition({ lat, lng });

            const name = place.name || '';
            const formattedName = name ? `${name} - ${place.formatted_address}` : place.formatted_address || '';

            setUserProfile(prevProfile => ({
              ...prevProfile,
              name: formattedName,
              address: place.formatted_address || '',
            }));
          }
        }
      );
    }
  }, []);

  const debouncedFetchPredictions = React.useCallback(
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

  const onMarkerDragEnd = React.useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMarkerPosition({ lat, lng });
      setMapCenter({ lat, lng });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;
          const name = results[0].address_components.find(component => component.types.includes('point_of_interest'))?.long_name || '';
          const city = results[0].address_components.find(component => component.types.includes('locality'))?.long_name || '';
          const formattedName = name && city ? `${name} - ${city}` : address;

          setUserProfile(prevProfile => ({
            ...prevProfile,
            address: address,
            name: formattedName,
          }));
        }
      });
    }
  }, []);

  const handleAddTimeWindow = (day: string) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      availability: {
        ...prevProfile.availability,
        [day]: [...(prevProfile.availability?.[day] || []), { start: null, end: null }],
      },
    }));
  };

  const handleRemoveTimeWindow = (day: string, index: number) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      availability: {
        ...prevProfile.availability,
        [day]: prevProfile.availability?.[day]?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  const handleChangeTimeWindow = (day: string, index: number, field: 'start' | 'end', value: Dayjs | null) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      availability: {
        ...prevProfile.availability,
        [day]: prevProfile.availability?.[day]?.map((window, i) => (i === index ? { ...window, [field]: value } : window)) || [],
      },
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
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
                value={userProfile.address || ''}
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

                    setUserProfile(prevProfile => ({
                      ...prevProfile,
                      address: address,
                      name: formattedName,
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
          value={userProfile.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Email"
          value={userProfile.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
          disabled
        />
        <TextField
          label="Age"
          value={userProfile.age || ''}
          onChange={(e) => handleInputChange('age', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Height"
          value={userProfile.height || ''}
          onChange={(e) => handleInputChange('height', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Shirt Size"
          value={userProfile.shirt_size || ''}
          onChange={(e) => handleInputChange('shirt_size', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Hair Color"
          value={userProfile.hair_color || ''}
          onChange={(e) => handleInputChange('hair_color', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Gender"
          value={userProfile.gender || ''}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Primary Language"
          value={userProfile.primary_language || ''}
          onChange={(e) => handleInputChange('primary_language', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <TextField
          label="Secondary Language"
          value={userProfile.secondary_language || ''}
          onChange={(e) => handleInputChange('secondary_language', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        />
        <Typography variant="h6" style={{ marginTop: 20 }}>Availability</Typography>
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
          <Box key={day} style={{ marginTop: 10 }}>
            <Typography variant="subtitle1">{day}</Typography>
            {userProfile.availability?.[day]?.map((window, index) => (
              <Box key={index} display="flex" alignItems="center" style={{ marginTop: 10 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Start Time"
                    value={window.start}
                    onChange={(newValue) => handleChangeTimeWindow(day, index, 'start', newValue)}
                  />
                  <DateTimePicker
                    label="End Time"
                    value={window.end}
                    onChange={(newValue) => handleChangeTimeWindow(day, index, 'end', newValue)}
                  />
                </LocalizationProvider>
                <IconButton onClick={() => handleRemoveTimeWindow(day, index)}>
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
            <Button onClick={() => handleAddTimeWindow(day)}>
              <AddIcon />
              Add Time Window
            </Button>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Save</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileForm;
