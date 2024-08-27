/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { styled } from '@mui/system';
import EditProfileForm from '../../../components/editProfileForm/editProfileForm';
import { useAuth } from '../../../auth/AuthContext';
import dayjs, { Dayjs } from 'dayjs';

const ProfileContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#f0f0f0',
});

const Header = styled('div')({
  width: '100%',
  backgroundColor: '#6f65ac',
  color: '#fff',
  padding: '20px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const Content = styled('div')({
  display: 'flex',
  marginTop: '20px',
  width: '100%',
  padding: '0 40px',
});

const LeftColumn = styled('div')({
  flex: 1,
  paddingRight: '20px',
});

const RightColumn = styled('div')({
  flex: 2,
});

const ProfileAvatar = styled(Avatar)({
  width: '100px',
  height: '100px',
  marginBottom: '10px',
});

const Section = styled('div')({
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
});

const InfoItem = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px',
  color: 'black',
});

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<{
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
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useAuth();

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const handleOpenDialog = (message: string) => {
    setDialogMessage(message);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
    
      try {
        const response = await fetch('http://localhost:5000/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
    
        const data = await response.json();

        // Convert date_of_birth to a Dayjs object if it's valid
        if (data.date_of_birth) {
          data.date_of_birth = dayjs(data.date_of_birth);
        }
        
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };    

    fetchUserProfile();
  }, [token]);

  return (
    <ProfileContainer>
      <Header>
        <Box display="flex" alignItems="center">
          <ProfileAvatar>{userProfile?.name.charAt(0)}</ProfileAvatar>
          <Typography variant="h5" ml={2}>
            {userProfile?.name}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            style={{ margin: '10px' }}
            onClick={() => setIsEditing(true)}
          >
            Edit profile
          </Button>
          <Button
            variant="contained"
            color="primary"
            style={{ margin: '10px' }}
            onClick={() => handleOpenDialog('Change email: To be implemented')}
          >
            Change email
          </Button>
          <Button
            variant="contained"
            color="primary"
            style={{ margin: '10px' }}
            onClick={() => handleOpenDialog('Change password: To be implemented')}
          >
            Change password
          </Button>
        </Box>
      </Header>
      <Content>
        <LeftColumn>
          <Section>
            <Typography variant="h6">Personal traits</Typography>
            <InfoItem>
              <span>Date of Birth</span>
              <span>{userProfile?.date_of_birth ? userProfile.date_of_birth.format('MM/DD/YYYY') : 'Not Entered'}</span>
            </InfoItem>
            <InfoItem>
              <span>Height</span>
              <span>{userProfile ? `${userProfile.height_ft || 'Not Entered'} ft ${userProfile.height_in || 'Not Entered'} in` : 'Not Entered'}</span>
            </InfoItem>
            <InfoItem>
              <span>Shirt Size</span>
              <span>{userProfile?.shirt_size || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Hair Color</span>
              <span>{userProfile?.hair_color || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Gender</span>
              <span>{userProfile?.gender || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Primary Language</span>
              <span>{userProfile?.primary_language || 'None'}</span>
            </InfoItem>
            <InfoItem>
              <span>Secondary Language</span>
              <span>{userProfile?.secondary_language || 'None'}</span>
            </InfoItem>
          </Section>
        </LeftColumn>
        <RightColumn>
          <Section>
            <Typography variant="h6">Additional Info</Typography>
            <InfoItem>
              <span>Email</span>
              <span>{userProfile?.email}</span>
            </InfoItem>
            <InfoItem>
              <span>Phone</span>
              <span>Not Entered</span>
            </InfoItem>
            <InfoItem>
              <span>Address</span>
              <span>{userProfile?.address || 'Not Entered'}</span>
            </InfoItem>
          </Section>
        </RightColumn>
      </Content>
      {isEditing && (
        <EditProfileForm
          open={isEditing}
          onClose={() => setIsEditing(false)}
          userProfile={userProfile}
          fetchUserProfile={async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
              const response = await fetch('http://localhost:5000/profile', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to fetch user profile');
              }

              const data = await response.json();

              // Convert date_of_birth to a Dayjs object if it's valid
              if (data.date_of_birth) {
                data.date_of_birth = dayjs(data.date_of_birth);
              }

              setUserProfile(data);
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }}
        />
      )}

      {/* Dialog for showing "To be implemented" messages */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Information</DialogTitle>
        <DialogContent>
          <Typography>{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </ProfileContainer>
  );
};

export default ProfilePage;
