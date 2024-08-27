/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';

const CreateProductForm: React.FC<{ open: boolean; onClose: () => void; fetchProducts: () => void }> = ({ open, onClose, fetchProducts }) => {
  const [products, setProducts] = useState<any[]>([
    { productName: '', barcode: '', msrp: 0, productGroup: '', productWorth: 1 }
  ]);
  const initialProductState = { productName: '', barcode: '', msrp: 0, productGroup: '', productWorth: 1 };
  
  useEffect(() => {
    if (open) {
      setProducts([initialProductState]);
    }
  }, [open]);

  const handleChange = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleAddMore = () => {
    setProducts([...products, { productName: '', barcode: '', msrp: 0, productGroup: '', productWorth: 1 }]);
  };

  const handleRemove = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      fetchProducts();
      onClose();
    } catch (error) {
      console.error('Error creating products:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Products</DialogTitle>
      <DialogContent>
        {products.map((product, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
            <TextField
              select
              label="Group"
              value={product.productGroup}
              onChange={(e) => handleChange(index, 'productGroup', e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
              fullWidth
            >
              <MenuItem value="Hard Punch">Hard Punch</MenuItem>
              <MenuItem value="Tea">Tea</MenuItem>
              <MenuItem value="Zero Sugar">Zero Sugar</MenuItem>
            </TextField>
            <TextField
              label="Product Name"
              value={product.productName}
              onChange={(e) => handleChange(index, 'productName', e.target.value)}
              style={{ marginRight: '10px', flex: 2 }}
              fullWidth
            />
            <TextField
              label="Barcode"
              value={product.barcode}
              onChange={(e) => handleChange(index, 'barcode', e.target.value)}
              style={{ marginRight: '10px', flex: 2 }}
              fullWidth
            />
            <TextField
              label="MSRP"
              value={product.msrp}
              onChange={(e) => handleChange(index, 'msrp', e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
              fullWidth
            />
            <TextField
              label="Worth"
              type="number"
              value={product.productWorth}
              onChange={(e) => handleChange(index, 'productWorth', e.target.value)}
              style={{ marginRight: '10px', flex: 1 }}
              fullWidth
            />
            <Button onClick={() => handleRemove(index)} color="secondary">Remove</Button>
          </div>
        ))}
        <div style={{display: 'flex', flexDirection: 'column'}}>
            <Button variant="outlined" color="primary" style={{ marginBottom: '20px', maxWidth: '200px'}}>
            Attach to Campaign
            </Button>
            <Button onClick={handleAddMore} color="primary" variant="contained" style={{ maxWidth: '120px' }}>
            Add More
            </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} color="primary">Create</Button>
        <Button onClick={onClose} color="secondary">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProductForm;
