/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/system';
import EditProfileForm from '../../components/editProfileForm/editProfileForm';
import { useAuth } from '../../auth/AuthContext';
import { Dayjs } from 'dayjs';

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
    age?: string;
    height?: string;
    shirt_size?: string;
    hairColor?: string;
    gender?: string;
    primaryLanguage?: string;
    secondaryLanguage?: string;
    address?: string;
    availability?: Record<string, { start: Dayjs | null, end: Dayjs | null }[]>;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useAuth();

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
        setUserProfile(data);
        console.log(userProfile);
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
          <Button variant="contained" color="primary" style={{ margin: '10px' }} onClick={() => setIsEditing(true)}>Edit profile</Button>
          <Button variant="contained" color="primary" style={{ margin: '10px' }}>Change email</Button>
          <Button variant="contained" color="primary" style={{ margin: '10px' }}>Change password</Button>
        </Box>
      </Header>
      <Content>
        <LeftColumn>
          <Section>
            <Typography variant="h6">Personal traits</Typography>
            <InfoItem>
              <span>Age</span>
              <span>{userProfile?.age || 'Not Entered'}</span>
            </InfoItem>
            <InfoItem>
              <span>Height</span>
              <span>{userProfile?.height || 'Not Entered'}</span>
            </InfoItem>
            <InfoItem>
              <span>Shirt Size</span>
              <span>{userProfile?.shirt_size || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Hair Color</span>
              <span>{userProfile?.hairColor || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Gender</span>
              <span>{userProfile?.gender || 'Unknown'}</span>
            </InfoItem>
            <InfoItem>
              <span>Primary Language</span>
              <span>{userProfile?.primaryLanguage || 'None'}</span>
            </InfoItem>
            <InfoItem>
              <span>Secondary Language</span>
              <span>{userProfile?.secondaryLanguage || 'None'}</span>
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
            <InfoItem>
              <span>Availability</span>
              <span>Not Entered</span>
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
              setUserProfile(data);
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }}
        />
      )}
    </ProfileContainer>
  );
};

export default ProfilePage;
