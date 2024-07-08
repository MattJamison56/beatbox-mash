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

  return (
    <div>
      <Navbar onSubcategoryChange={handleSubcategoryChange} />
      <div style={{ padding: '20px', margin: '64px'}}>
        {currentSubcategory === 'Brand Ambassadors' && <BrandAmbassadorsPage />}
        {currentSubcategory === 'Teams' && <CreateTeamsPage />}
        {currentSubcategory === 'Venues' && <CreateVenuesPage />}
        {currentSubcategory === 'Products' && <CreateProductsPage />}
        {currentSubcategory === 'Campaigns' && <CampaignsPage onCreateCampaign={handleCreateCampaign} />}
        {currentSubcategory === 'Create Campaign' && <CreateCampaignPage onBackToCampaigns={handleBackToCampaignPage} />}
        {currentSubcategory === 'Create Event Date' && <CreateEventDate />}
        {currentSubcategory === 'List Events' && <ListEventsPage />}
        {!currentSubcategory && <h1 style={{color: 'black' }}>Welcome to the Home Page</h1>}
      </div>
    </div>
  );
};

export default HomePage;
