import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import MoneyIcon from '@mui/icons-material/Money';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register the necessary elements
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale);

const apiUrl = import.meta.env.VITE_API_URL;

const QANumericalResultsPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState({
    totalEvents: 0,
    totalVenues: 0,
    totalAmbassadors: 0,
    totalRevenue: 0,
    totalUnitsSold: 0,
  });

  const [chartsData, setChartsData] = useState({
    productsSampled: [],
    productSamplingMethods: [],
    flavorsSold: [],
    consumersFirstTime: [],
  });

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/sales-summary`);
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    const fetchChartsData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/qa-numerical-results`);
        const data = await response.json();
        setChartsData(data);
      } catch (error) {
        console.error('Error fetching charts data:', error);
      }
    };

    fetchSummaryData();
    fetchChartsData();
  }, []);

  const productsSampledData = {
    labels: chartsData.productsSampled.map(item => item.productName),
    datasets: [
      {
        label: 'Percentage Sampled',
        data: chartsData.productsSampled.map(item => item.percentage),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const productSamplingMethodsData = {
    labels: chartsData.productSamplingMethods.map(item => item.method),
    datasets: [
      {
        label: 'Sampling Methods',
        data: chartsData.productSamplingMethods.map(item => item.percentage),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  const flavorsSoldData = {
    labels: chartsData.flavorsSold.map(item => item.flavor),
    datasets: [
      {
        label: 'Flavors Sold',
        data: chartsData.flavorsSold.map(item => item.percentage),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
      },
    ],
  };

  const consumersFirstTimeData = {
    labels: chartsData.consumersFirstTime.map(item => item.option), 
    datasets: [
      {
        label: 'First Time Consumers',
        data: chartsData.consumersFirstTime.map(item => item.percentage), 
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#81C784', '#D4E157'],
      },
    ],
  };

  const tableData = [
    {
      question: 'What flavors did you sample?',
      data: chartsData.productsSampled.map(item => ({
        choice: item.productName,
        count: item.count, 
        percentage: item.percentage
      }))
    },
    {
      question: 'How was the product sampled?',
      data: chartsData.productSamplingMethods.map(item => ({
        choice: item.method,
        count: item.count, 
        percentage: item.percentage 
      }))
    },
    {
      question: 'What flavors were sold?',
      data: chartsData.flavorsSold.map(item => ({
        choice: item.flavor,
        count: item.count, 
        percentage: item.percentage 
      }))
    },
    {
      question: 'What percentage of attendees were first-time BeatBox consumers?',
      data: chartsData.consumersFirstTime.map(item => ({
        choice: item.option,
        count: item.count,
        percentage: item.percentage
      }))
    }
  ];
  
  
  return (
    <Box sx={{ width: '100%' }}>
        {/* Summary Stats */}
        <Grid container spacing={1.2} sx={{ marginBottom: 3 }}>
            <Grid item xs={2.4} sm={6} md={2.4}>
            <Paper sx={{ backgroundColor: '#b19cd9', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <EventIcon sx={{ color: 'black' }} />
                <Typography variant="h6" sx={{ color: 'black' }}>{summaryData.totalEvents} Events</Typography>
            </Paper>
            </Grid>
            <Grid item xs={2.4} sm={6} md={2.4}>
            <Paper sx={{ backgroundColor: '#add8e6', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <StoreIcon sx={{ color: 'black' }} />
                <Typography variant="h6" sx={{ color: 'black' }}>{summaryData.totalVenues} Venues</Typography>
            </Paper>
            </Grid>
            <Grid item xs={2.4} sm={6} md={2.4}>
            <Paper sx={{ backgroundColor: '#c1e1c1', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: 'black' }} />
                <Typography variant="h6" sx={{ color: 'black' }}>{summaryData.totalAmbassadors} Ambassadors</Typography>
            </Paper>
            </Grid>
            <Grid item xs={2.4} sm={6} md={2.4}>
            <Paper sx={{ backgroundColor: '#ffcccb', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <MoneyIcon sx={{ color: 'black' }} />
                <Typography variant="h6" sx={{ color: 'black' }}>${summaryData.totalRevenue.toFixed(2)} Revenue</Typography>
            </Paper>
            </Grid>
            <Grid item xs={2.4} sm={6} md={2.4}>
            <Paper sx={{ backgroundColor: '#f8dda8', padding: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <InventoryIcon sx={{ color: 'black' }} />
                <Typography variant="h6" sx={{ color: 'black' }}>{summaryData.totalUnitsSold} Units Sold</Typography>
            </Paper>
            </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{color:"black"}}>What flavors did you sample?</Typography>
            <Bar data={productsSampledData} />
            </Grid>
            <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{color:"black"}}>How was the product sampled?</Typography>
            <Bar data={productSamplingMethodsData} />
            </Grid>
            <Grid item xs={12} md={4}>
            <Typography variant="h6" style={{color:"black"}}>What flavors were sold?</Typography>
            <Bar data={flavorsSoldData} />
            </Grid>
            <Grid item xs={6} md={3}>
            <Typography variant="h6" style={{color:"black"}}>What percentage of attendees were first-time BeatBox consumers?</Typography>
            <Pie data={consumersFirstTimeData} />
            </Grid>
        </Grid>

        {/* Data Table */}
        <Box sx={{ marginTop: 3 }}>
                <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                    <TableRow>
                        <TableCell>Questions</TableCell>
                        <TableCell>Choices</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Percentage</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {tableData.map((section, index) => (
                        <React.Fragment key={index}>
                        {section.data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                            {rowIndex === 0 && (
                                <TableCell rowSpan={section.data.length}>
                                {section.question}
                                </TableCell>
                            )}
                            <TableCell>{row.choice}</TableCell>
                            <TableCell>{row.count}</TableCell>
                            <TableCell>{row.percentage}%</TableCell>
                            </TableRow>
                        ))}
                        </React.Fragment>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Box>
        </Box>
      );
    };

export default QANumericalResultsPage;