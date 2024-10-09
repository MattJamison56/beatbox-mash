/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
import { saveAs } from 'file-saver';

const apiUrl = import.meta.env.VITE_API_URL;

const BrandAmbassadorsSubTabContent: React.FC = () => {
  const [subTabValue, setSubTabValue] = useState(0);
  const [baData, setBaData] = useState<any[]>([]);

  // Fetch data from the backend
  useEffect(() => {
    const fetchBaData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/ba-data`);
        const data = await response.json();
        setBaData(data);
      } catch (error) {
        console.error('Error fetching brand ambassadors data:', error);
      }
    };

    fetchBaData();
  }, []);

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
              data: baData.map((item) => item.demosLastMonth),
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
              data: baData.map((item) => item.totalHoursWorked),
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

  const handleExportToExcel = async () => {
    try {
      const response = await fetch(`${apiUrl}/data/export-ba-data`, {
        method: 'GET',
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      saveAs(blob, 'BrandAmbassadorsData.xlsx');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <Box>
      {/* Export to Excel button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" color="primary" onClick={handleExportToExcel}>
          Export to Excel
        </Button>
      </Box>
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
                    <img
                      src={ba.baAvatarUrl || 'https://via.placeholder.com/50'}
                      alt={`${ba.baName} avatar`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                    />
                    {ba.baName}
                  </TableCell>
                  <TableCell align="right">{ba.demosLastMonth}</TableCell>
                  <TableCell align="right">{ba.totalUnitsSold}</TableCell>
                  <TableCell align="right">{ba.totalDollarSales.toFixed(2)}</TableCell>
                  <TableCell align="right">{(ba.totalUnitsSold / ba.demosLastMonth).toFixed(2)}</TableCell> {/* avgSalesPerDemo */}
                  <TableCell align="right">{(ba.totalDollarSales / ba.demosLastMonth).toFixed(2)}</TableCell> {/* avgDollarSalesPerDemo */}
                  <TableCell align="right">{ba.totalHoursWorked}</TableCell>
                  <TableCell align="right">{(ba.totalHoursWorked / ba.demosLastMonth).toFixed(2)}</TableCell> {/* avgHoursPerDemo */}
                  <TableCell align="right">{ba.salesPerHour.toFixed(2)}</TableCell>
                  <TableCell align="right">{(ba.totalDollarSales / ba.totalHoursWorked).toFixed(2)}</TableCell> {/* dollarSalesPerHour */}
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
