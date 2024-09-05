/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
const apiUrl = import.meta.env.VITE_API_URL;

const VenueSubTabContent: React.FC = () => {
  const [subTabValue, setSubTabValue] = useState(0);
  const [venueData, setVenueData] = useState<any[]>([]);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/venue-data`);
        const data = await response.json();
        setVenueData(data);
      } catch (error) {
        console.error('Error fetching venue data:', error);
      }
    };

    fetchVenueData();
  }, []);

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  const getChartData = (): ChartData<'bar', number[], string> => {
    const labels = venueData.map((item) => item.venueName);
    
    switch (subTabValue) {
      case 0: // Demos by Venue
        return {
          labels,
          datasets: [
            {
              label: '# Demos by Venue',
              data: venueData.map((item) => item.demosLastMonth),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
      case 1: // Total Hours
        return {
          labels,
          datasets: [
            {
              label: 'Total Hours',
              data: venueData.map((item) => item.totalHoursWorked),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        };
      case 2: // Avg Hours per Demo
        return {
          labels,
          datasets: [
            {
              label: 'Avg Hours per Demo',
              data: venueData.map((item) => item.avgHoursPerDemo),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        };
      case 3: // Total Sales (new tab for total products sold)
        return {
          labels,
          datasets: [
            {
              label: 'Total Sales',
              data: venueData.map((item) => item.totalUnitsSold),
              backgroundColor: 'rgba(255, 205, 86, 0.6)',
            },
          ],
        };
      case 4: // Avg Sales per Demo
        return {
          labels,
          datasets: [
            {
              label: 'Avg Sales per Demo',
              data: venueData.map((item) => item.avgSalesPerDemo),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        };
      case 5: // Sales per Hour
        return {
          labels,
          datasets: [
            {
              label: 'Sales per Hour',
              data: venueData.map((item) => item.salesPerHour),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  return (
    <Box>
      {/* Subtabs for Venue */}
      <Tabs value={subTabValue} onChange={handleSubTabChange} aria-label="venue subtabs" sx={{ marginBottom: 2 }}>
        <Tab label="# Demos by Venue" />
        <Tab label="Total Hours" />
        <Tab label="Avg Hours per Demo" />
        <Tab label="Total Sales" /> {/* New tab added */}
        <Tab label="Avg Sales per Demo" />
        <Tab label="Sales per Hour" />
      </Tabs>

      {/* Chart Section */}
      <Box sx={{ width: '100%', height: 300 }}>
        <Bar
          data={getChartData()}
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
          <Table aria-label="venue sales table">
            <TableHead>
              <TableRow>
                <TableCell>Venue</TableCell>
                <TableCell>State</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right"># Demos</TableCell>
                <TableCell align="right"># Total Sales</TableCell>
                <TableCell align="right">$ Total Sales</TableCell>
                <TableCell align="right"># Avg Sales per Demo</TableCell>
                <TableCell align="right">$ Avg Sales per Demo</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell align="right">Avg Hours per Demo</TableCell>
                <TableCell align="right"># Sales per demo Hour</TableCell>
                <TableCell align="right">$ Sales per demo Hour</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {venueData.map((venue, index) => (
                <TableRow key={index}>
                  <TableCell>{venue.venueName}</TableCell>
                  <TableCell>{venue.state}</TableCell>
                  <TableCell>{venue.city}</TableCell>
                  <TableCell align="right">{venue.demosLastMonth}</TableCell>
                  <TableCell align="right">{venue.totalUnitsSold}</TableCell>
                  <TableCell align="right">{venue.totalDollarSales.toFixed(2)}</TableCell>
                  <TableCell align="right">{venue.avgSalesPerDemo}</TableCell>
                  <TableCell align="right">{venue.avgDollarSalesPerDemo.toFixed(2)}</TableCell>
                  <TableCell align="right">{venue.totalHoursWorked}</TableCell>
                  <TableCell align="right">{venue.avgHoursPerDemo}</TableCell>
                  <TableCell align="right">{venue.salesPerHour.toFixed(2)}</TableCell>
                  <TableCell align="right">{venue.dollarSalesPerHour.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default VenueSubTabContent;
