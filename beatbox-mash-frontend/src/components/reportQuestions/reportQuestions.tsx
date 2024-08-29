/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Box, Modal, Paper, Button, IconButton, Typography, TextField, FormControlLabel, Checkbox, Grid, FormGroup, Autocomplete } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
const apiUrl = import.meta.env.VITE_API_URL;

const swagOptions = [
  'Stickers',
  'T-Shirts',
  'Hats',
  'Keychains',
  'Posters',
  'Coupons',
  'Sample Packs',
];

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
  const [formData, setFormData] = useState<any>({
    sampledFlavors: [],
    price: '',
    consumers_sampled: '',
    consumers_engaged: '',
    total_attendees: '',
    beatboxes_purchased: '',
    first_time_consumers: '',
    product_sampled_how: [],
    top_reason_bought: '',
    top_reason_didnt_buy: '',
    qr_scans: '',
    table_location: '',
    swag: '',
    customer_feedback: '',
    other_feedback: ''
  });
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${apiUrl}/products`);
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
      if (products.length === 0) return; // Wait until products are fetched

      try {
        const response = await fetch(`${apiUrl}/reports/getInventorySalesData/${eventId}`);
        const data = await response.json();
  
        // Calculate totalPurchased considering ProductWorth
        const totalPurchased = data.reduce((total: number, item: any) => {
          const product = products.find(p => p.ProductID === item.product_id);
          const productWorth = product ? product.ProductWorth : 1;
          return total + (item.sold || 0) * productWorth;
        }, 0);
  
        setInventoryProducts(data.map((item: any) => item.ProductName));
  
        setFormData((prevData: any) => ({
          ...prevData,
          beatboxes_purchased: String(totalPurchased),
          sampledFlavors: data.map((item: any) => item.ProductName) // Precheck based on inventory products
        }));
      } catch (error) {
        console.error('Error fetching inventory products:', error);
      }
    };
  
    if (open) {
      fetchInventoryProducts();
    }
  }, [open, eventId, products]);  

  useEffect(() => {
    if (open) {
      const fetchSavedData = async () => {
        try {
          const response = await fetch(`${apiUrl}/reports/getReportQuestionsData/${eventId}`);
          if (response.ok) {
            const data = await response.json();
            setFormData((prevData: any) => ({
              ...prevData,
              ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
              sampledFlavors: prevData?.sampledFlavors?.length ? prevData.sampledFlavors : (data.sampledFlavors ? data.sampledFlavors.split(',') : inventoryProducts), // Ensure prechecked flavors
              product_sampled_how: data.product_sampled_how ? data.product_sampled_how.split(',') : []
            }));
          } else if (response.status === 404) {
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
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: checked
        ? [...(prevData[name] || []), value]
        : prevData[name].filter((item: any) => item !== value)
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/reports/saveReportQuestionsData`, {
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
                  value={formData.price}
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
                  name="consumers_sampled"
                  value={formData.consumers_sampled}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">4. Number of consumers engaged with?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="consumers_engaged"
                  value={formData.consumers_engaged}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">5. How many people were at the event (whether sampled or not)?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="total_attendees"
                  value={formData.total_attendees}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">6. How many BeatBoxes were purchased?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="beatboxes_purchased"
                  value={formData.beatboxes_purchased}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">7. What % consumers that you talked to tried or heard of BeatBox for the FIRST time at this sampling?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="first_time_consumers"
                  value={formData.first_time_consumers}
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
                          checked={formData.product_sampled_how ? formData.product_sampled_how.includes(method) : false}
                          onChange={handleCheckboxChange}
                          value={method}
                          name="product_sampled_how"
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
                  name="top_reason_bought"
                  value={formData.top_reason_bought}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">10. When shoppers did NOT purchase BeatBox, what was the TOP reason they didn't?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="top_reason_didnt_buy"
                  value={formData.top_reason_didnt_buy}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">11. How many QR code scans did you collect?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="qr_scans"
                  value={formData.qr_scans}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">12. Where was your table located?</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="table_location"
                  value={formData.table_location}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  13. Was any swag handed out? If so, what kind of swag?
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={swagOptions}
                  value={formData.swag.split(',')}
                  onChange={(_event, newValue) => {
                    setFormData((prevData: any) => ({
                      ...prevData,
                      swag: newValue.join(','),
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Select or type swag" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">14. Please share customer feedback</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="customer_feedback"
                  value={formData.customer_feedback}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">15. Please share any other details or feedback about the event</Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="other_feedback"
                  value={formData.other_feedback}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Box mt={3} display="flex" alignItems="center" justifyContent="center">
          <Button variant="contained" color="primary" onClick={handleSave} style={{ margin: '5px' }}>Validate & Save</Button>
          <Button variant="outlined" onClick={handleClose} style={{ margin: '5px' }}>Close</Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ReportQuestionsForm;
