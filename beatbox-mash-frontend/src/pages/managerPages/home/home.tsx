/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import Navbar from '../../../components/managerNavbar/managerNavbar';
import BrandAmbassadorsPage from '../brandAmbassadorPage/bapage';
import CreateTeamsPage from '../createTeamPage/createTeamPage';
import CreateVenuesPage from '../venuePage/createVenuePage';
import CreateProductsPage from '../productPage/createProductPage';
import CampaignsPage from '../campaignPage/campaignPage';
import CreateCampaignPage from '../createCampaignPage/createCampaignPage';
import CreateEventDate from '../createEventDate/createEventDate';
import ListEventsPage from '../listEventPage/listEventPage';
import ManageAccountsPage from '../accountCreation/ManageAccountsPage';
import ProfilePage from '../profilePage/profilePage';
import ApproveEventsPage from '../approveEventsPage/approveEventsPage';
import ManagePayrollPage from '../managePayrollPage/managePayrollPage';
import PaymentHistoryPage from '../paymentHistoryPage/paymentHistoryPage';
import CompletedReportsPage from '../getCompletedPage/getCompletedPage';
import SalesResultsPage from '../salesResultsPage/salesResultsPage';
import HomePageContent from './homePage';
import QANumericalResultsPage from '../numericalResultsPage/numericalResultsPage';

const HomePage: React.FC = () => {
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const handleSubcategoryChange = (subcategory: string | null) => {
    setCurrentSubcategory(subcategory);
    console.log(subcategory);
  };

  const handleCreateCampaign = (campaign: any = null) => { 
    setSelectedCampaign(campaign);
    setCurrentSubcategory('Create Campaign');
  };

  const handleBackToCampaignPage = () => {
    setCurrentSubcategory('Campaigns');
    setSelectedCampaign(null);
  };

  const handleEventCreation = () => {
    setCurrentSubcategory('List Events');
  };

  const handleCampaignFromReports = (campaign: any) => {
    setSelectedCampaign(campaign);
    setCurrentSubcategory('Create Campaign');
  };

  return (
    <div>
      <Navbar onSubcategoryChange={handleSubcategoryChange} />
      <div style={{ padding: '20px', margin: '64px'}}>
        {!currentSubcategory && (
          <>
            <HomePageContent />
          </>
        )}
        {currentSubcategory === 'Brand Ambassadors' && <BrandAmbassadorsPage />}
        {currentSubcategory === 'Teams' && <CreateTeamsPage />}
        {currentSubcategory === 'Venues' && <CreateVenuesPage />}
        {currentSubcategory === 'Products' && <CreateProductsPage />}
        {currentSubcategory === 'Campaigns' && <CampaignsPage onCreateCampaign={handleCreateCampaign} />}
        {currentSubcategory === 'Create Campaign' && <CreateCampaignPage onBackToCampaigns={handleBackToCampaignPage} campaign={selectedCampaign}/>}
        {currentSubcategory === 'Create Event Date' && <CreateEventDate onEventCreation={handleEventCreation} />}
        {currentSubcategory === 'List Events' && <ListEventsPage />}
        {currentSubcategory === 'Brand Managers' && <ManageAccountsPage />}
        {currentSubcategory === 'Profile' && <ProfilePage />}
        {currentSubcategory === 'Approve Submitted Events' && <ApproveEventsPage />}
        {currentSubcategory === 'Manage Payroll' && <ManagePayrollPage />}
        {currentSubcategory === 'Payment History' && <PaymentHistoryPage />}
        {currentSubcategory === 'Completed Reports' && <CompletedReportsPage onCampaignClick={handleCampaignFromReports} />}
        {currentSubcategory === 'Sales Results' && <SalesResultsPage />}
        {currentSubcategory === 'Q&A Numerical Results' && <QANumericalResultsPage />}
      </div>
    </div>
  );
};

export default HomePage;
