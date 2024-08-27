/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { GoogleMap, Libraries, LoadScriptNext, MarkerF } from '@react-google-maps/api';
import { Dayjs } from 'dayjs';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';

const libraries: Libraries = ['places'] as const;

const commonLanguages = [
  'English', 'Spanish', 'Mandarin', 'French', 'German', 'Japanese', 
  'Russian', 'Portuguese', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 
  'Indonesian', 'Korean', 'Italian', 'Dutch', 'Swedish', 'Greek'
];

const hairColors = [
  'Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Bald'
];

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  date_of_birth?: Dayjs | null;
  height_ft?: string;
  height_in?: string;
  shirt_size?: string;
  hair_color?: string;
  gender?: string;
  primary_language?: string;
  secondary_language?: string;
  address?: string;
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
    date_of_birth: null,
    height_ft: '',
    height_in: '',
    shirt_size: '',
    hair_color: '',
    gender: '',
    primary_language: '',
    secondary_language: '',
    address: '',
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (open) {
      if (initialProfile) {
        setUserProfile({
          ...initialProfile,
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

  const handleSelect = async (address: string) => {
    try {
      const results = await geocodeByAddress(address);
      const { lat, lng } = await getLatLng(results[0]);
      setUserProfile((prevProfile) => ({
        ...prevProfile,
        address
      }));
      setMapCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setUserProfile(prevProfile => ({ ...prevProfile, [field]: value }));
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      const geocoder = new google.maps.Geocoder();
  
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;
          setUserProfile((prevProfile) => ({
            ...prevProfile,
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        <LoadScriptNext googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} libraries={libraries}>
          <>
            <PlacesAutocomplete
              value={userProfile.address || ''}
              onChange={(address) => handleInputChange('address', address)}
              onSelect={(address) => handleSelect(address)}
            >
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
        <div style={{ marginTop: 10 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              value={userProfile.date_of_birth || null}
              onChange={(newValue) => handleInputChange('date_of_birth', newValue)}
            />
          </LocalizationProvider>
        </div>
        <Box display="flex" justifyContent="space-between" style={{ marginTop: 10 }}>
          <TextField
            label="Height (ft)"
            type="number"
            value={userProfile.height_ft || ''}
            onChange={(e) => handleInputChange('height_ft', e.target.value)}
            style={{ marginRight: 16, width: '48%' }}
          />
          <TextField
            label="Height (in)"
            type="number"
            value={userProfile.height_in || ''}
            onChange={(e) => handleInputChange('height_in', e.target.value)}
            style={{ marginRight: 16, width: '48%' }}
          />
        </Box>
        <TextField
          select
          label="Shirt Size"
          value={userProfile.shirt_size || ''}
          onChange={(e) => handleInputChange('shirt_size', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        >
          {['ExtraSmall', 'Small', 'Medium', 'Large', 'ExtraLarge', 'DoubleExtraLarge'].map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Hair Color"
          value={userProfile.hair_color || ''}
          onChange={(e) => handleInputChange('hair_color', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        >
          {hairColors.map((color) => (
            <MenuItem key={color} value={color}>
              {color}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Gender"
          select
          value={userProfile.gender || ''}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <TextField
          select
          label="Primary Language"
          value={userProfile.primary_language || ''}
          onChange={(e) => handleInputChange('primary_language', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        >
          {commonLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              {language}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Secondary Language"
          select
          value={userProfile.secondary_language || ''}
          onChange={(e) => handleInputChange('secondary_language', e.target.value)}
          style={{ marginRight: 16, marginTop: 10, width: '100%' }}
        >
          {commonLanguages.map((language) => (
            <MenuItem key={language} value={language}>
              {language}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Save</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileForm;
