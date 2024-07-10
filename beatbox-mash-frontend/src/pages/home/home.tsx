import { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/navbar';
import BrandAmbassadorsPage from '../bapage/bapage';
import CreateTeamsPage from '../createTeamPage/createTeamPage';
import CreateVenuesPage from '../venuePage/createVenuePage';
import CreateProductsPage from '../productPage/createProductPage';
import CampaignsPage from '../campaignPage/campaignPage';
import CreateCampaignPage from '../createCampaignPage/createCampaignPage';
import CreateEventDate from '../createEventDate/createEventDate';
import ListEventsPage from '../listEventPage/listEventPage';
import ManageAccountsPage from '../accountCreation/ManageAccountsPage';

const HomePage: React.FC = () => {
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; role: string } | null>(null);

  const handleSubcategoryChange = (subcategory: string | null) => {
    setCurrentSubcategory(subcategory);
    console.log(subcategory);
  };

  const handleCreateCampaign = () => {
    setCurrentSubcategory('Create Campaign');
  };

  const handleBackToCampaignPage = () => {
    setCurrentSubcategory('Campaigns');
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
        setUserProfile(data);
        console.log(data);
        console.log(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div>
      <Navbar onSubcategoryChange={handleSubcategoryChange} />
      <div style={{ padding: '20px', margin: '64px'}}>
        {!currentSubcategory && (
          <>
            <h1 style={{color: 'black' }}>Welcome to the Home Page</h1>
            {userProfile && (
              <div>
                <p>Name: {userProfile.name}</p>
                <p>Email: {userProfile.email}</p>
                <p>Role: {userProfile.role}</p>
              </div>
            )}
          </>
        )}
        {currentSubcategory === 'Brand Ambassadors' && <BrandAmbassadorsPage />}
        {currentSubcategory === 'Teams' && <CreateTeamsPage />}
        {currentSubcategory === 'Venues' && <CreateVenuesPage />}
        {currentSubcategory === 'Products' && <CreateProductsPage />}
        {currentSubcategory === 'Campaigns' && <CampaignsPage onCreateCampaign={handleCreateCampaign} />}
        {currentSubcategory === 'Create Campaign' && <CreateCampaignPage onBackToCampaigns={handleBackToCampaignPage} />}
        {currentSubcategory === 'Create Event Date' && <CreateEventDate />}
        {currentSubcategory === 'List Events' && <ListEventsPage />}
        {currentSubcategory === 'Brand Managers' && <ManageAccountsPage />}
      </div>
    </div>
  );
};

export default HomePage;