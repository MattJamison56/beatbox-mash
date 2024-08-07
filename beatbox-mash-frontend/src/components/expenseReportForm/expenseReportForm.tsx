import React, { useState } from 'react';
import { Box, Typography, Modal, Paper, IconButton, Card, CardContent, Grid, ButtonBase } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptForm from './receiptForm';
import MileageForm from './mileageForm';

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

interface ExpenseFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
  eventName: string;
  startTime: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, handleClose, eventId, eventName, startTime }) => {
  const [openReceiptForm, setOpenReceiptForm] = useState(false);
  const [openMileageForm, setOpenMileageForm] = useState(false);

  const handleOpenMileageForm = () => {
    setOpenMileageForm(true);
  };

  const handleCloseMileageForm = () => {
    setOpenMileageForm(false);
  };

  const handleOpenReceiptForm = () => {
    setOpenReceiptForm(true);
  };

  const handleCloseReceiptForm = () => {
    setOpenReceiptForm(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="expense-modal-title"
        aria-describedby="expense-modal-description"
      >
        <Paper sx={modalStyle}>
          <Box display="flex" justifyContent="center" position="relative" mb={2}>
            <Box textAlign="center">
              <Typography variant="h5">{eventName}</Typography>
              <Typography variant="subtitle1">{startTime}</Typography>
            </Box>
            <Box position="absolute" top={0} right={0}>
              <IconButton onClick={handleClose} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <Box display="flex" alignSelf="center" borderBottom={1} borderColor="grey.300" mb={2} width="40%" /> {/* Centered Spacing line */}
          <Box display="flex" justifyContent="center" position="relative" mb={2}>
            <Typography variant="h6" id="expense-modal-title">Attach Expenses</Typography>
          </Box>
          <Grid container spacing={2} justifyContent="center">
            {[
              { text: 'Receipt', color: '#83E8E1', icon: <ReceiptIcon sx={{ fontSize: 40, color: 'white' }} />, onClick: handleOpenReceiptForm },
              { text: 'Mileage', color: '#AAD1F9', icon: <DirectionsCarIcon sx={{ fontSize: 40, color: 'white' }} />, onClick: handleOpenMileageForm },
              { text: 'Other', color: '#FEBED6', icon: <AttachMoneyIcon sx={{ fontSize: 40, color: 'white' }} />, onClick: () => alert('Attach Other') }
            ].map((item, index) => (
              <Grid key={index} item xs={4} md={1} display="flex" flexDirection="column" alignItems="center">
                <ButtonBase onClick={item.onClick}>
                  <Card sx={{ minHeight: '6em', minWidth: '6em', backgroundColor: item.color, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {item.icon}
                    </CardContent>
                  </Card>
                </ButtonBase>
                <Typography variant="body2" mt={1} textAlign="center" style={{ color: '#555' }}>{item.text}</Typography>
              </Grid>
            ))}
          </Grid>
          <Box display="flex" alignSelf="center" borderBottom={1} borderColor="grey.300" mt={2} width="50%" /> {/* Centered Spacing line */}
        </Paper>
      </Modal>
      <ReceiptForm open={openReceiptForm} handleClose={handleCloseReceiptForm} eventId={eventId} />
      <MileageForm open={openMileageForm} handleClose={handleCloseMileageForm} eventId={eventId} />
    </>
  );
};

export default ExpenseForm;
