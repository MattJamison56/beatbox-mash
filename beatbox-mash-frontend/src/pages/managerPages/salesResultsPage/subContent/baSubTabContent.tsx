/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

const BrandAmbassadorsSubTabContent: React.FC = () => {
  const [subTabValue, setSubTabValue] = useState(0);

  // Dummy data for Brand Ambassadors
  const baData = [
    {
      baName: 'Aasha Lewis-Redway',
      demos: 1,
      totalSales: 4,
      totalDollarSales: 15.96,
      avgSalesPerDemo: 4,
      avgDollarSalesPerDemo: 15.96,
      totalHours: '3 hrs 0 min',
      avgHoursPerDemo: '3 hrs 0 min',
      salesPerHour: 1.33,
      dollarSalesPerHour: 5.32,
      avatarUrl: 'https://via.placeholder.com/50'
    },
    {
      baName: 'Audrey Andrews',
      demos: 1,
      totalSales: 18,
      totalDollarSales: 87.82,
      avgSalesPerDemo: 18,
      avgDollarSalesPerDemo: 87.82,
      totalHours: '3 hrs 15 min',
      avgHoursPerDemo: '3 hrs 15 min',
      salesPerHour: 5.54,
      dollarSalesPerHour: 27.02,
      avatarUrl: 'https://via.placeholder.com/50'
    },
    // Add more BA data as needed
  ];

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  const getChartData = (): ChartData<'bar', number[], string> => {
    const labels = baData.map((item) => item.baName);
    
    switch (subTabValue) {
      case 0: // Demos by BA
        return {
          labels,
          datasets: [
            {
              label: 'Demos by BA',
              data: baData.map((item) => item.demos),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
      case 1: // Sales per Hour
        return {
          labels,
          datasets: [
            {
              label: 'Sales per Hour',
              data: baData.map((item) => item.salesPerHour),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        };
      case 2: // Total Hours by BA
        return {
          labels,
          datasets: [
            {
              label: 'Total Hours by BA',
              data: baData.map((item) => parseFloat(item.totalHours.split(' ')[0])),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        };
      case 3: // Total Sales by BA
        return {
          labels,
          datasets: [
            {
              label: 'Total Sales by BA',
              data: baData.map((item) => item.totalDollarSales),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  return (
    <Box>
      {/* Subtabs for Brand Ambassadors */}
      <Tabs value={subTabValue} onChange={handleSubTabChange} aria-label="BA subtabs" sx={{ marginBottom: 2 }}>
        <Tab label="Demos by BA" />
        <Tab label="Sales per Hour" />
        <Tab label="Total Hours by BA" />
        <Tab label="Total Sales by BA" />
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
          <Table aria-label="ba sales table">
            <TableHead>
              <TableRow>
                <TableCell>BA Name</TableCell>
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
              {baData.map((ba, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <img src={ba.avatarUrl} alt={`${ba.baName} avatar`} style={{ width: '40px', borderRadius: '50%', marginRight: '10px' }} />
                    {ba.baName}
                  </TableCell>
                  <TableCell align="right">{ba.demos}</TableCell>
                  <TableCell align="right">{ba.totalSales}</TableCell>
                  <TableCell align="right">{ba.totalDollarSales.toFixed(2)}</TableCell>
                  <TableCell align="right">{ba.avgSalesPerDemo}</TableCell>
                  <TableCell align="right">{ba.avgDollarSalesPerDemo.toFixed(2)}</TableCell>
                  <TableCell align="right">{ba.totalHours}</TableCell>
                  <TableCell align="right">{ba.avgHoursPerDemo}</TableCell>
                  <TableCell align="right">{ba.salesPerHour.toFixed(2)}</TableCell>
                  <TableCell align="right">{ba.dollarSalesPerHour.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default BrandAmbassadorsSubTabContent;
