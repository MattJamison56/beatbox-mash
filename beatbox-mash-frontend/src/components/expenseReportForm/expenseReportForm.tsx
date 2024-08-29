import React, { useState } from 'react';
import { Box, Typography, Modal, Paper, IconButton, Card, CardContent, Grid, ButtonBase, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptForm from './receiptForm';
import MileageForm from './mileageForm';
import OtherForm from './otherForm';
import { Tooltip } from '@mui/material';

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
  onComplete: () => void;
  mileageAllowed: boolean;
  ba_id: string | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, handleClose, eventId, eventName, startTime, onComplete, mileageAllowed, ba_id }) => {
  const [openReceiptForm, setOpenReceiptForm] = useState(false);
  const [openMileageForm, setOpenMileageForm] = useState(false);
  const [openOtherForm, setOpenOtherForm] = useState(false);

  const handleOpenOtherForm = () => {
    setOpenOtherForm(true);
  };

  const handleCloseOtherForm = () => {
    setOpenOtherForm(false);
  };

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

  const handleSubmit = () => {
    onComplete();
    handleClose();
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
              {
                text: 'Mileage', 
                color: '#AAD1F9', 
                icon: <DirectionsCarIcon sx={{ fontSize: 40, color: 'white' }} />, 
                onClick: handleOpenMileageForm,
                disabled: !mileageAllowed, // Disable if mileage is not allowed
                tooltip: "Mileage expense must be allowed by manager.", // Tooltip message
              },
              { text: 'Other', color: '#FEBED6', icon: <AttachMoneyIcon sx={{ fontSize: 40, color: 'white' }} />, onClick: handleOpenOtherForm }
            ].map((item, index) => (
              <Grid key={index} item xs={4} md={1} display="flex" flexDirection="column" alignItems="center">
                <Tooltip title={item.disabled ? item.tooltip : ''} disableHoverListener={!item.disabled}>
                  <span>
                    <ButtonBase onClick={item.onClick} disabled={item.disabled}>
                      <Card sx={{ minHeight: '6em', minWidth: '6em', backgroundColor: item.color, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: item.disabled ? 0.5 : 1 }}>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {item.icon}
                        </CardContent>
                      </Card>
                    </ButtonBase>
                  </span>
                </Tooltip>
                <Typography variant="body2" mt={1} textAlign="center" style={{ color: '#555' }}>{item.text}</Typography>
              </Grid>
            ))}
          </Grid>
          <Box display="flex" alignSelf="center" borderBottom={1} borderColor="grey.300" mt={2} width="50%" /> {/* Centered Spacing line */}
          <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 2, alignSelf: 'center' }}>
            Submit
          </Button>
        </Paper>
      </Modal>
      <ReceiptForm open={openReceiptForm} handleClose={handleCloseReceiptForm} eventId={eventId} ba_id={ba_id} />
      <MileageForm open={openMileageForm} handleClose={handleCloseMileageForm} eventId={eventId} ba_id={ba_id} />
      <OtherForm open={openOtherForm} handleClose={handleCloseOtherForm} eventId={eventId} ba_id={ba_id} />
    </>
  );
};

export default ExpenseForm;

