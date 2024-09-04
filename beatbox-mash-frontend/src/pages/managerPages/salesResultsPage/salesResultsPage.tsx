import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Grid } from '@mui/material';
import ProductSubTabContent from './productSubTabContent';
import EventIcon from '@mui/icons-material/Event';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const SalesResultsPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Multicolored Tabs at the top */}
      <Grid container spacing={0} sx={{ marginBottom: 3 }}>
        <Grid item xs={2.4} sm={6} md={2.4}>
          <Paper sx={{ backgroundColor: '#b19cd9', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <EventIcon sx={{ color: 'black' }} />
            <Typography variant="h6" sx={{ color: 'black' }}>13 Events</Typography>
          </Paper>
        </Grid>
        <Grid item xs={2.4} sm={6} md={2.4}>
          <Paper sx={{ backgroundColor: '#add8e6', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <StoreIcon sx={{ color: 'black' }} />
            <Typography variant="h6" sx={{ color: 'black' }}>12 Venues</Typography>
          </Paper>
        </Grid>
        <Grid item xs={2.4} sm={6} md={2.4}>
          <Paper sx={{ backgroundColor: '#c1e1c1', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <PeopleIcon sx={{ color: 'black' }} />
            <Typography variant="h6" sx={{ color: 'black' }}>12 Ambassadors</Typography>
          </Paper>
        </Grid>
        <Grid item xs={2.4} sm={6} md={2.4}>
          <Paper sx={{ backgroundColor: '#ffcccb', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <AttachMoneyIcon sx={{ color: 'black' }} />
            <Typography variant="h6" sx={{ color: 'black' }}>647.38 Revenue</Typography>
          </Paper>
        </Grid>
        <Grid item xs={2.4} sm={6} md={2.4}>
          <Paper sx={{ backgroundColor: '#f8dda8', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <InventoryIcon sx={{ color: 'black' }} />
            <Typography variant="h6" sx={{ color: 'black' }}>62 Units Sold</Typography>
          </Paper>
        </Grid>
      </Grid>

       {/* Tabs for Product, Brand Ambassadors, Venue, and State */}
       <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="sales results tabs"
          sx={{
            '& .MuiTab-root': { 
              textTransform: 'none',  
              color: 'black',      
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              '&.Mui-selected': {
                backgroundColor: '#6f65ac',  
                color: 'white',              
              },
            },
            '& .MuiTabs-indicator': {
              display: 'none', 
            },
          }}
        >
          <Tab label="Product" {...a11yProps(0)} />
          <Tab label="Brand Ambassadors" {...a11yProps(1)} />
          <Tab label="Venue" {...a11yProps(2)} />
          <Tab label="State" {...a11yProps(3)} />
        </Tabs>

      {/* Main Content for Each Tab */}
      <Box sx={{ paddingTop: 2 }}>
        {value === 0 && <ProductSubTabContent />} {/* Product Tab */}
        {value === 1 && <Typography>Brand Ambassadors content goes here</Typography>}
        {value === 2 && <Typography>Venue content goes here</Typography>}
        {value === 3 && <Typography>State content goes here</Typography>}
      </Box>
    </Box>
  );
};

export default SalesResultsPage;