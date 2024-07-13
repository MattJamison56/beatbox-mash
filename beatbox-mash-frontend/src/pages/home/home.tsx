/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from 'react';
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

  const handleEventCreation = () => {
    setCurrentSubcategory('List Events');
  };

  return (
    <div>
      <Navbar onSubcategoryChange={handleSubcategoryChange} />
      <div style={{ padding: '20px', margin: '64px'}}>
        {!currentSubcategory && (
          <>
            <h1 style={{color: 'black' }}>This is the Home Page</h1>
          </>
        )}
        {currentSubcategory === 'Brand Ambassadors' && <BrandAmbassadorsPage />}
        {currentSubcategory === 'Teams' && <CreateTeamsPage />}
        {currentSubcategory === 'Venues' && <CreateVenuesPage />}
        {currentSubcategory === 'Products' && <CreateProductsPage />}
        {currentSubcategory === 'Campaigns' && <CampaignsPage onCreateCampaign={handleCreateCampaign} />}
        {currentSubcategory === 'Create Campaign' && <CreateCampaignPage onBackToCampaigns={handleBackToCampaignPage} />}
        {currentSubcategory === 'Create Event Date' && <CreateEventDate onEventCreation={handleEventCreation} />}
        {currentSubcategory === 'List Events' && <ListEventsPage />}
        {currentSubcategory === 'Brand Managers' && <ManageAccountsPage />}
      </div>
    </div>
  );
};

export default HomePage;
