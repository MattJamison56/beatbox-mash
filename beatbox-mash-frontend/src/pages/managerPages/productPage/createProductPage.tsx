/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CreateProductForm from '../../../components/createProductForm/createProductForm';

const CreateProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<null | any>(null);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, product: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleDeactivate = async () => {
    try {
      const response = await fetch(`http://localhost:5000/products/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedProduct.ProductID }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setProducts(products.filter(product => product.ProductID !== selectedProduct.ProductID));
      handleMenuClose();
    } catch (error) {
      console.error('Error deactivating product:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className='title'>Products</h1>
        <Button variant="contained" color="primary" onClick={handleOpenForm}>
          Create Product
        </Button>
      </div>
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>MSRP</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.ProductName}</TableCell>
                <TableCell>{product.Barcode}</TableCell>
                <TableCell>{product.MSRP}</TableCell>
                <TableCell>{product.ProductGroup}</TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleMenuClick(event, product)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleDeactivate}>Deactivate</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CreateProductForm open={openForm} onClose={handleCloseForm} fetchProducts={fetchProducts} />
    </div>
  );
};

export default CreateProductsPage;