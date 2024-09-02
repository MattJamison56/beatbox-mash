/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './salesResultsPage.css'; // Custom CSS

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

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

  const chartData = {
    labels: ['Blue Razz 11.1%', 'Fresh Watermelon 11.1%', 'Fruit Punch 11.1%', 'Green Apple 11.1%', 'Hard Tea 11.1%', 'Juicy Mango 11.1%', 'Pink Lemonade 11.1%', 'Red White and Blue Variety Pack 11.1% (6-pack, Count as 6)', 'TEA Variety Pack 11.1% (6-pack, Count as 6)', 'Tropical Punch 11.1%'],
    datasets: [
      {
        label: 'Units Sold',
        data: [7, 2, 6, 3, 6, 4, 4, 1, 19, 1],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={value} onChange={handleChange} aria-label="sales results tabs">
        <Tab label="Product" {...a11yProps(0)} />
        <Tab label="Brand Ambassadors" {...a11yProps(1)} />
        <Tab label="Venue" {...a11yProps(2)} />
        <Tab label="State" {...a11yProps(3)} />
      </Tabs>

      <TabPanel value={value} index={0}>
        {/* Chart Section */}
        <Box sx={{ width: '100%', height: 300 }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </Box>

        {/* Table Section */}
        <Box sx={{ marginTop: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="sales results table">
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell align="right"># Demos</TableCell>
                  <TableCell align="right"># Units Sold</TableCell>
                  <TableCell align="right">$ Units Sold</TableCell>
                  <TableCell align="right">Units Sampled</TableCell>
                  <TableCell align="right"># of Those who sampled</TableCell>
                  <TableCell align="right">$ Avg Sales per Demo</TableCell>
                  <TableCell align="right">% Not Sold at Demo</TableCell>
                  <TableCell align="right"># Online Orders</TableCell>
                  <TableCell align="right"># Bulk Units Sold</TableCell>
                  <TableCell align="right"># Inventory Count</TableCell>
                  <TableCell align="right"># Purchased</TableCell>
                  <TableCell align="right"># Distributed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Blue Razz 11.1%</TableCell>
                  <TableCell align="right">2</TableCell>
                  <TableCell align="right">7</TableCell>
                  <TableCell align="right">$27.93</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">3.5</TableCell>
                  <TableCell align="right">90.41</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">0</TableCell>
                  <TableCell align="right">0</TableCell>
                </TableRow>
                {/* Repeat similar rows for other products */}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>
      <TabPanel value={value} index={1}>
        {/* Similar structure for Brand Ambassadors tab */}
        <Typography>Brand Ambassadors content goes here</Typography>
      </TabPanel>
      <TabPanel value={value} index={2}>
        {/* Similar structure for Venue tab */}
        <Typography>Venue content goes here</Typography>
      </TabPanel>
      <TabPanel value={value} index={3}>
        {/* Similar structure for State tab */}
        <Typography>State content goes here</Typography>
      </TabPanel>
    </Box>
  );
};

export default SalesResultsPage;
