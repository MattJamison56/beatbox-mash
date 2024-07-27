/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Box, Modal, Paper, Button, IconButton, Typography, Checkbox, FormControlLabel, List, ListItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '50%',
  bgcolor: 'background.paper',
  p: 4,
  outline: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FCFCFC'
};

interface ProductSelectionFormProps {
  open: boolean;
  handleClose: () => void;
  products: any[];
  selectedProducts: any[];
  handleProductSelection: (selected: any) => void;
}

const ProductSelectionForm: React.FC<ProductSelectionFormProps> = ({ open, handleClose, products, selectedProducts, handleProductSelection }) => {
  const [selected, setSelected] = useState<any[]>(selectedProducts);

  const toggleSelection = (product: any) => {
    setSelected((prev) =>
      prev.some((item) => item.ProductID === product.ProductID)
        ? prev.filter((item) => item.ProductID !== product.ProductID)
        : [...prev, product]
    );
  };

  const handleSelectAll = () => {
    setSelected(products.length === selected.length ? [] : products);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Paper sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Select Products</Typography>
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box mb={2}>
          <Button variant="text" onClick={handleSelectAll}>
            {products.length === selected.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        <List>
          {products.map((product: any) => (
            <ListItem key={product.ProductID}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected.some((item) => item.ProductID === product.ProductID)}
                    onChange={() => toggleSelection(product)}
                  />
                }
                label={`${product.ProductName}`}
              />
            </ListItem>
          ))}
        </List>
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleProductSelection(selected)}
          >
            Add Products
          </Button>
          <Button variant="outlined" onClick={handleClose}>Close</Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ProductSelectionForm;
