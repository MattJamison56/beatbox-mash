/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Modal, Paper, Button, IconButton, Typography, TextField, FormControlLabel, Checkbox, Grid, FormGroup } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  height: '100%',
  bgcolor: 'background.paper',
  p: 4,
  outline: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FCFCFC',
  overflow: 'auto',
};

interface ReportQuestionsFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
  eventName: string;
  startTime: string;
  onComplete: () => void;
}

const ReportQuestionsForm: React.FC<ReportQuestionsFormProps> = ({ open, handleClose, eventId, eventName, startTime, onComplete }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    const fetchInventoryProducts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/reports/getInventorySalesData/${eventId}`);
        const data = await response.json();
        setInventoryProducts(data.map((item: any) => item.ProductName)); // Adjust to match the actual structure of your data

        const totalPurchased = data.reduce((total: number, item: any) => total + (item.sold || 0), 0);
        setFormData((prevData: any) => ({
          ...prevData,
          beatboxesPurchased: totalPurchased,
          sampledFlavors: data.map((item: any) => item.ProductName) // Precheck based on inventory products
        }));
      } catch (error) {
        console.error('Error fetching inventory products:', error);
      }
    };

    if (open) {
      fetchInventoryProducts();
    }
  }, [open, eventId]);

  useEffect(() => {
    if (open) {
      const fetchSavedData = async () => {
        try {
          const response = await fetch(`http://localhost:5000/reports/getReportQuestionsData/${eventId}`);
          if (response.ok) {
            const data = await response.json();
            setFormData((prevData: any) => ({
              ...prevData,
              ...data,
              sampledFlavors: prevData.sampledFlavors || data.sampledFlavors || inventoryProducts // Ensure prechecked flavors
            }));
          } else {
            setFormData((prevData: any) => ({
              ...prevData,
              sampledFlavors: inventoryProducts // Precheck based on inventory products
            }));
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching saved data:', error);
          setLoading(false);
        }
      };

      fetchSavedData();
    }
  }, [open, eventId, inventoryProducts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prevFormData: any) => ({
      ...prevFormData,
      [name]: checked
        ? [...(prevFormData[name] || []), value]
        : prevFormData[name].filter((item: any) => item !== value)
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/reports/saveReportQuestionsData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId, ...formData })
      });

      if (response.ok) {
        onComplete();
        handleClose();
      } else {
        console.error('Error saving data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  if (loading || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Paper sx={modalStyle}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography variant="h5">{eventName}</Typography>
          <Typography variant="subtitle1">{startTime}</Typography>
          <IconButton onClick={handleClose} aria-label="close" style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">1. What flavors did you sample?</Typography>
                <FormGroup>
                  {products.map((product) => (
                    <FormControlLabel
                      key={product.ProductID}
                      control={
                        <Checkbox
                          checked={formData.sampledFlavors ? formData.sampledFlavors.includes(product.ProductName) : false}
                          onChange={handleCheckboxChange}
                          value={product.ProductName}
                          name="sampledFlavors"
                        />
                      }
                      label={product.ProductName}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">2. What was the price of BeatBox?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  3. How many consumers were sampled? 
                  (this means how many people actually sampled BeatBox, NOT how 
                  many samples were given in total. Example: 1 sample to 1 person = 1; 
                  3 samples to 1 person = 1) 
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="consumersSampled"
                  value={formData.consumersSampled || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">4. Number of consumers engaged with?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="consumersEngaged"
                  value={formData.consumersEngaged || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">5. How many people were at the event (whether sampled or not)?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="totalAttendees"
                  value={formData.totalAttendees || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">6. How many BeatBoxes were purchased?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="beatboxesPurchased"
                  value={formData.beatboxesPurchased || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">7. What % consumers that you talked to tried or heard of BeatBox for the FIRST time at this sampling?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="firstTimeConsumers"
                  value={formData.firstTimeConsumers || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">8. How was the product sampled?</Typography>
                <FormGroup>
                  {['Chilled', 'Over Ice', 'In a cocktail', 'Frozen/Slushie', 'Other'].map((method) => (
                    <FormControlLabel
                      key={method}
                      control={
                        <Checkbox
                          checked={formData.productSampledHow ? formData.productSampledHow.includes(method) : false}
                          onChange={handleCheckboxChange}
                          value={method}
                          name="productSampledHow"
                        />
                      }
                      label={method}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">9. When shoppers DID purchase BeatBox, what was the TOP reason they bought?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="topReasonBought"
                  value={formData.topReasonBought || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">10. When shoppers did NOT purchase BeatBox, what was the TOP reason they didn't?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="topReasonDidntBuy"
                  value={formData.topReasonDidntBuy || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">11. How many QR code scans did you collect?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="qrScans"
                  value={formData.qrScans || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">12. Where was your table located?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="tableLocation"
                  value={formData.tableLocation || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">13. Was any swag handed out? If so, what kind of swag?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="swag"
                  value={formData.swag || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">14. Please share customer feedback</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="customerFeedback"
                  value={formData.customerFeedback || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">15. Please share any other details or feedback about the event</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="otherFeedback"
                  value={formData.otherFeedback || ''}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Box mt={3} display="flex" alignItems="center" justifyContent="center">
          <Button variant="contained" color="primary" onClick={handleSave} style={{margin: '5px'}}>Validate & Save</Button>
          <Button variant="outlined" onClick={handleClose} style={{margin: '5px'}}>Close</Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ReportQuestionsForm;
