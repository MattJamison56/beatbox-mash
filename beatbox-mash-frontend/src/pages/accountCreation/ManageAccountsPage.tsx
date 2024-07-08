import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ManageAccountsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1 className='title'>Brand Ambassadors</h1>
      <Button variant="contained" color="primary" onClick={() => navigate('/create-account')}>
        Add Manager
      </Button>
    </>
  );
};

export default ManageAccountsPage;
