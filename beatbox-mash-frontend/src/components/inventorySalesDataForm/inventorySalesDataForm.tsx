/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Modal, Paper, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ProductSelectionForm from './productSelectionForm'; // Import the ProductSelectionForm component

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '97%',
  height: '95%',
  maxHeight: '100vh',
  maxWidth: '100vw',
  overflow: 'auto',
  bgcolor: 'background.paper',
  p: 4,
  outline: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FCFCFC'
};

interface InventorySalesDataFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
  onComplete: () => void;
}

const InventorySalesDataForm: React.FC<InventorySalesDataFormProps> = ({ open, handleClose, eventId, onComplete }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (open) {
      const fetchSavedData = async () => {
        try {
          const response = await fetch(`http://localhost:5000/reports/getInventorySalesData/${eventId}`);
          const data = await response.json();

          // Map the fetched data to match the expected structure
          const mappedData = data.map((item: any) => ({
            ProductID: item.product_id,
            ProductName: products.find(p => p.ProductID === item.product_id)?.ProductName || 'Unknown',
            beginningInventory: item.beginning_inventory,
            endingInventory: item.ending_inventory
          }));

          setSelectedProducts(mappedData);
        } catch (error) {
          console.error('Error fetching saved data:', error);
        }
      };

      fetchSavedData();
    }
  }, [open, eventId, products]);

  const handleProductSelection = (selected: any) => {
    setSelectedProducts(selected);
    setIsProductSelectionOpen(false);
  };

  const handleInventoryChange = (index: number, field: string, value: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value,
      sold: (field === 'endingInventory' ? updatedProducts[index].beginningInventory - value : value - updatedProducts[index].endingInventory)
    };
    setSelectedProducts(updatedProducts);
  };

  const calculateTotal = (field: string) => {
    return selectedProducts.reduce((total, product) => total + (product[field] || 0), 0);
  };

  const handleSave = async () => {
    const inventoryData = selectedProducts.map(product => ({
      product_id: product.ProductID,
      beginning_inventory: product.beginningInventory || 0,
      ending_inventory: product.endingInventory || 0,
      sold: (product.beginningInventory || 0) - (product.endingInventory || 0)
    }));

    try {
      const response = await fetch('http://localhost:5000/reports/saveInventorySalesData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId, inventoryData })
      });

      if (response.ok) {
        onComplete();
        handleClose();
      } else {
        const errorData = await response.json();
        console.error('Error saving data:', errorData);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Paper sx={modalStyle}>
        <Box display="flex" justifyContent="right" alignItems="right" mb={2}>
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box display="flex" justifyContent="left" alignItems="center" mb={2}>
          <Button variant="contained" color="primary" style={{ margin: '10px' }} onClick={() => setIsProductSelectionOpen(true)}>Add Manually</Button>
          <FormControlLabel style={{ margin: '10px' }}
            control={<Switch />}
            label="Bulk Update"
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Beginning Inventory</TableCell>
                <TableCell>Ending Inventory</TableCell>
                <TableCell># Sold</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedProducts.map((product: any, index) => (
                <TableRow key={product.ProductID}>
                  <TableCell>{product.ProductName}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={product.beginningInventory || ''}
                      onChange={(e) => handleInventoryChange(index, 'beginningInventory', parseInt(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={product.endingInventory || ''}
                      onChange={(e) => handleInventoryChange(index, 'endingInventory', parseInt(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>{(product.beginningInventory || 0) - (product.endingInventory || 0)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>{calculateTotal('beginningInventory')}</strong></TableCell>
                <TableCell><strong>{calculateTotal('endingInventory')}</strong></TableCell>
                <TableCell><strong>{calculateTotal('beginningInventory') - calculateTotal('endingInventory')}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="contained" color="primary" onClick={handleSave}>Validate & Save</Button>
          <Button variant="outlined" onClick={handleClose}>Close</Button>
        </Box>
        <ProductSelectionForm
          open={isProductSelectionOpen}
          handleClose={() => setIsProductSelectionOpen(false)}
          products={products}
          selectedProducts={selectedProducts}
          handleProductSelection={handleProductSelection}
        />
      </Paper>
    </Modal>
  );
};

export default InventorySalesDataForm;
