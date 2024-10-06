/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

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

  const getChartData = (tabIndex: number): ChartData<'bar', number[], string> => {
    const labels = productData.map((item) => item.ProductName);

    switch (tabIndex) {
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

  const handleExportToExcel = async () => {
    try {
      const images: string[] = [];

      for (let i = 0; i <= 3; i++) {
        // Capture the chart as an image
        const chartElement = document.getElementById(`product-chart-${i}`);
        if (!chartElement) {
          throw new Error(`Chart element product-chart-${i} not found`);
        }

        const canvas = await html2canvas(chartElement);
        const imageData = canvas.toDataURL('image/png');
        images.push(imageData);
      }

      const response = await fetch(`${apiUrl}/data/export-product-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataArray: images }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      saveAs(blob, 'ProductData.xlsx');
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

      {/* Subtabs for Product */}
      <Tabs
        value={subTabValue}
        onChange={handleSubTabChange}
        aria-label="product subtabs"
        sx={{ marginBottom: 2 }}
      >
        <Tab label="Units Sold" />
        <Tab label="Average Sales" />
        <Tab label="# Demos by Product" />
        <Tab label="Percent Not Sold at Demo" />
      </Tabs>

      {/* Render all charts */}
      {[0, 1, 2, 3].map((tabIndex) => (
        <Box
          key={tabIndex}
          id={`product-chart-${tabIndex}`}
          sx={{
            width: '100%',
            height: 300,
            display: subTabValue === tabIndex ? 'block' : 'none',
          }}
        >
          <Bar
            data={getChartData(tabIndex)}
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
      ))}

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
                  <TableCell align="right">{product.totalDollarSales}</TableCell>
                  <TableCell align="right">{product.avgSalesPerDemo}</TableCell>
                  <TableCell align="right">{product.percentNotSoldAtDemo}%</TableCell>
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
