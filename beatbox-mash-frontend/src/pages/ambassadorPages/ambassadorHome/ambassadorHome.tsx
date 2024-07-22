import React, { useState } from 'react';
import AmbassadorNavbar from '../../../components/ambassadorNavbar/ambassadorNavbar';
import Dashboard from '../dashboard/dashboard';
import Events from '../events/events';
// import MyBids from '../myBids/myBids';
// import Invoices from '../invoices/invoices';
// import CompletedReports from '../completedReports/completedReports';
// import Documents from '../documents/documents';
// import ProfilePage from '../profilePage/profilePage';

const AmbassadorHome: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('DASHBOARD');

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    console.log(tab);
  };

  return (
    <div>
      <AmbassadorNavbar onTabChange={handleTabChange} />
      <div style={{ padding: '20px', marginTop: '64px' }}>
        {currentTab === 'DASHBOARD' && <Dashboard />}
        {currentTab === 'EVENTS' && <Events />}
        {/* 
        {currentTab === 'MY BIDS' && <MyBids />}
        {currentTab === 'INVOICES' && <Invoices />}
        {currentTab === 'COMPLETED REPORTS' && <CompletedReports />}
        {currentTab === 'DOCUMENTS' && <Documents />}
        {currentTab === 'Profile' && <ProfilePage />} 
        */}
      </div>
    </div>
  );
};

export default AmbassadorHome;
