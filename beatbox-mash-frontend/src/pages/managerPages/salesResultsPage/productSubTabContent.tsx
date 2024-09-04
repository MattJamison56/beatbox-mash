/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
const apiUrl = import.meta.env.VITE_API_URL;

const ProductSubTabContent: React.FC = () => {
  const [subTabValue, setSubTabValue] = useState(0);
  const [productData, setProductData] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch(`${apiUrl}/data/product-data`);
        const data = await response.json();
        setProductData(data);
      } catch (error) {
        console.error('Error fetching product data:', error);
      }
    };

    fetchProductData();
  }, []);

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSubTabValue(newValue);
  };

  const getChartData = (): ChartData<'bar', number[], string> => {
    const labels = productData.map((item) => item.ProductName);
    
    switch (subTabValue) {
      case 0: // Units Sold
        return {
          labels,
          datasets: [
            {
              label: 'Units Sold',
              data: productData.map((item) => item.unitsSold),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
          ],
        };
      case 1: // Average Sales
        return {
          labels,
          datasets: [
            {
              label: 'Average Sales',
              data: productData.map((item) => item.avgSalesPerDemo),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
            },
          ],
        };
      case 2: // Demos by Product
        return {
          labels,
          datasets: [
            {
              label: '# Demos by Product',
              data: productData.map((item) => item.demosByProduct),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
          ],
        };
      case 3: // Percent Not Sold at Demo
        return {
          labels,
          datasets: [
            {
              label: '% Not Sold at Demo',
              data: productData.map((item) => item.percentNotSoldAtDemo),
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
      {/* Subtabs for Product */}
      <Tabs value={subTabValue} onChange={handleSubTabChange} aria-label="product subtabs" sx={{ marginBottom: 2 }}>
        <Tab label="Units Sold" />
        <Tab label="Average Sales" />
        <Tab label="# Demos by Product" />
        <Tab label="Percent Not Sold at Demo" />
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
          <Table aria-label="product sales table">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell align="right"># Demos</TableCell>
                <TableCell align="right"># Units Sold</TableCell>
                <TableCell align="right">$ Units Sold</TableCell>
                <TableCell align="right">$ Avg Sales per Demo</TableCell>
                <TableCell align="right">% Not Sold at Demo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productData.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.ProductName}</TableCell>
                  <TableCell align="right">{product.demosByProduct}</TableCell>
                  <TableCell align="right">{product.unitsSold}</TableCell>
                  <TableCell align="right">{product.totalSales}</TableCell>
                  <TableCell align="right">{product.avgSalesPerDemo}</TableCell>
                  <TableCell align="right">{product.percentNotSoldAtDemo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ProductSubTabContent;