import React, { useState } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';

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
  backgroundColor: '#FCFCFC',
};

interface OtherFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
  ba_id: string | null;
}

const OtherForm: React.FC<OtherFormProps> = ({ open, handleClose, eventId, ba_id }) => {
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async () => {
    const data = {
      eventId,
      category,
      paymentMethod,
      date: selectedDate?.toISOString(),
      amount,
      notes,
      ba_id: ba_id
    };

    try {
      const response = await fetch('http://localhost:5000/reports/other', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      console.log('Data successfully submitted');
      handleClose();
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="other-form-modal-title" aria-describedby="other-form-modal-description">
      <Paper sx={modalStyle}>
        <Box display="flex" flexDirection="column" alignItems="left" mb={2}>
          <Typography variant="h5">Other Expenses</Typography>
          <IconButton onClick={handleClose} aria-label="close" style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" mb={2} sx={{ width: '100%' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as string)}
            >
              <MenuItem value="Festival Per Diem">Festival Per Diem</MenuItem>
              <MenuItem value="Ice">Ice</MenuItem>
              <MenuItem value="Off Premise Product Receipt">Off Premise Product Receipt</MenuItem>
              <MenuItem value="On Premise Product Receipt">On Premise Product Receipt</MenuItem>
              <MenuItem value="Parking">Parking</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-label"
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value as string)}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit/Debit">Credit/Debit</MenuItem>
              <MenuItem value="Mileage">Mileage</MenuItem>
            </Select>
          </FormControl>

          <Box style={{ alignSelf: "flex-start", marginBottom: '16px', width: '100%' }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                label="Date"
                value={selectedDate}
                onChange={setSelectedDate}
                />
            </LocalizationProvider>
          </Box>

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Box>

        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, marginTop: '0px', maxWidth: '100px', alignSelf: 'center' }}>
          Submit
        </Button>
      </Paper>
    </Modal>
  );
};

export default OtherForm;
