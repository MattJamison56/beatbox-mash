/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
const apiUrl = import.meta.env.VITE_API_URL;

const StateSubTabContent: React.FC = () => {
  const [subTabValue, setSubTabValue] = useState(0);
  const [stateData, setStateData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStateData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/state-data`);
        const data = await response.json();
        setStateData(data);
      } catch (error) {
        console.error('Error fetching state data:', error);
      }
    };

    fetchStateData();
  }, []);

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  const getChartData = (): ChartData<'bar', number[], string> => {
    const labels = stateData.map((item) => item.state);
    
    switch (subTabValue) {
      case 0: // Demos by State
        return {
          labels,
          datasets: [
            {
              label: '# Demos by State',
              data: stateData.map((item) => item.demosLastMonth),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
      case 1: // Total Hours
        return {
          labels,
          datasets: [
            {
              label: 'Total Hours by State',
              data: stateData.map((item) => item.totalDemoHours),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
          ],
        };
      case 2: // Avg Hours per Demo
        return {
          labels,
          datasets: [
            {
              label: 'Avg Hours per Demo by State',
              data: stateData.map((item) => item.avgHoursPerDemo),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        };
      case 3: // Total Sales (product sales, not monetary)
        return {
          labels,
          datasets: [
            {
              label: 'Total Sales (Units) by State',
              data: stateData.map((item) => item.totalUnitsSold),
              backgroundColor: 'rgba(255, 205, 86, 0.6)',
            },
          ],
        };
      case 4: // Avg Sales per Demo (product units sold per demo)
        return {
          labels,
          datasets: [
            {
              label: 'Avg Sales per Demo (Units) by State',
              data: stateData.map((item) => item.avgSalesPerDemo),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
          ],
        };
      case 5: // Sales per Hour (product units sold per hour)
        return {
          labels,
          datasets: [
            {
              label: 'Sales per Hour (Units) by State',
              data: stateData.map((item) => item.salesPerHour),
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
      {/* Subtabs for State */}
      <Tabs value={subTabValue} onChange={handleSubTabChange} aria-label="state subtabs" sx={{ marginBottom: 2 }}>
        <Tab label="# Demos by State" />
        <Tab label="Total Hours" />
        <Tab label="Avg Hours per Demo" />
        <Tab label="Total Sales" />
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
          <Table aria-label="state sales table">
            <TableHead>
              <TableRow>
                <TableCell>State</TableCell>
                <TableCell align="right"># Demos</TableCell>
                <TableCell align="right">Total Demo Hours</TableCell>
                <TableCell align="right">Avg Hours per Demo</TableCell>
                <TableCell align="right"># Total Sales</TableCell>
                <TableCell align="right">$ Total Sales</TableCell>
                <TableCell align="right"># Avg Sales per Demo</TableCell>
                <TableCell align="right">$ Avg Sales per Demo</TableCell>
                <TableCell align="right"># Sales per demo Hour</TableCell>
                <TableCell align="right">$ Sales per demo Hour</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stateData.map((state, index) => (
                <TableRow key={index}>
                  <TableCell>{state.state}</TableCell>
                  <TableCell align="right">{state.demosLastMonth}</TableCell>
                  <TableCell align="right">{state.totalDemoHours}</TableCell>
                  <TableCell align="right">{state.avgHoursPerDemo}</TableCell>
                  <TableCell align="right">{state.totalUnitsSold}</TableCell>
                  <TableCell align="right">{state.totalDollarSales.toFixed(2)}</TableCell>
                  <TableCell align="right">{state.avgSalesPerDemo}</TableCell>
                  <TableCell align="right">{state.avgDollarSalesPerDemo.toFixed(2)}</TableCell>
                  <TableCell align="right">{state.salesPerHour.toFixed(2)}</TableCell>
                  <TableCell align="right">{state.dollarSalesPerHour.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default StateSubTabContent;
