/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton, Grid, Alert, TextField, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { ArrowUpward, Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
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

interface ReceiptFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
}

interface Item {
  name: string;
  amount: number;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({ open, handleClose, eventId }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [items, setItems] = useState<Item[]>([{ name: '', amount: 0 }]);

  const onDrop = useCallback((acceptedFiles: any[], rejectedFiles: any[]) => {
    if (acceptedFiles?.length) {
      setFiles(previousFiles => [
        ...previousFiles,
        ...acceptedFiles.map(file =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        )
      ]);
    }

    if (rejectedFiles?.length) {
      setError('No images bigger than 3000x3000 are accepted');
    } else {
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': []
    },
    maxSize: 3000 * 3000,
    onDrop
  });

  useEffect(() => {
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (name: string) => {
    setFiles(files => files.filter(file => file.name !== name));
  };

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', String(eventId));
    formData.append('date', selectedDate?.toISOString() || '');
    formData.append('notes', notes);
    formData.append('category', category);
    formData.append('paymentMethod', paymentMethod);
    formData.append('items', JSON.stringify(items));
  
    try {
      const response = await fetch('http://localhost:5000/reports/receipts', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        handleClose();
      } else {
        console.error('Error uploading files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="photo-upload-modal-title" aria-describedby="photo-upload-modal-description">
      <Paper sx={modalStyle}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography variant="h5">Attach Receipts</Typography>
          <IconButton onClick={handleClose} aria-label="close" style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box {...getRootProps()} className="dropzone" style={{ display: 'flex', border: '2px dashed #cccccc', textAlign: 'center', alignSelf: 'center', maxWidth: "400px", maxHeight: "200px", justifyContent: "center", padding: '100px' }}>
          <input {...getInputProps()} />
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            <ArrowUpward sx={{ fontSize: 40 }} />
            {isDragActive ? (
              <Typography variant="body2">Drop the files here ...</Typography>
            ) : (
              <Typography variant="body2">Drag & drop files here, or click to select files</Typography>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} justifyContent="center" marginTop="30px">
          {files.map(file => (
            <Grid item key={file.name} xs={6} sm={4} md={3} lg={2}>
              <Box position="relative">
                <img
                  src={file.preview}
                  alt={file.name}
                  width="100%"
                  style={{ objectFit: 'contain', borderRadius: '4px' }}
                />
                <IconButton
                  onClick={() => removeFile(file.name)}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    },
                  }}
                >
                  <Close />
                </IconButton>
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-all' }}>
                  {file.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid item xs={12} md={6}>
            <Box display="flex" flexDirection="column" alignSelf="center" mb={2} sx={{ width: '100%' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </LocalizationProvider>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                margin="normal"
              />
            
            <Box display="flex" alignSelf="center" borderBottom={1} borderColor="grey.300" mb={2} width="100%" marginTop="20px" /> {/* Centered Spacing line */}

            {/* Item Name and Amount Section */}
            <Box mb={2}>
              <Typography variant="h6">Items</Typography>
              {items.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <TextField
                    label="Item Name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    fullWidth
                    margin="normal"
                    sx={{ marginRight: 2 }}
                  />
                  <TextField
                    label="Amount ($)"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                    fullWidth
                    margin="normal"
                    sx={{ marginRight: 2 }}
                  />
                  <IconButton onClick={() => removeItem(index)} aria-label="delete">
                    <CloseIcon />
                  </IconButton>
                </Box>
              ))}
              <Button variant="outlined" onClick={addItem}>Add an Additional Item</Button>
            </Box>

            <Box display="flex" alignSelf="center" borderBottom={1} borderColor="grey.300" mb={2} width="100%" marginTop="20px" /> {/* Centered Spacing line */}

              <TextField
                label="Category"
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                margin="normal"
              >
                <MenuItem value="Festival Per Diem">Festival Per Diem</MenuItem>
                <MenuItem value="Ice">Ice</MenuItem>
                <MenuItem value="Off Prem Product Receipt">Off Prem Product Receipt</MenuItem>
                <MenuItem value="Parking">Parking</MenuItem>
              </TextField>
              <TextField
                label="Payment Method"
                select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                fullWidth
                margin="normal"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Credit/Debit">Credit/Debit</MenuItem>
                <MenuItem value="Mileage">Mileage</MenuItem>
              </TextField>
            </Box>
          </Grid>
        </Grid>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          sx={{ mt: 2, marginTop: '0px', maxWidth: '100px', alignSelf: 'center' }}
        >
          Submit
        </Button>
      </Paper>
    </Modal>
  );
};

export default ReceiptForm;
