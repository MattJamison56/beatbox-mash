import React, { useState } from 'react';
import { Box, Typography, Modal, Paper, IconButton, Card, CardContent, Grid, ButtonBase, Button, Checkbox, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventorySalesDataForm from '../../components/inventorySalesDataForm/inventorySalesDataForm';
import ReportQuestionsForm from '../../components/reportQuestions/reportQuestions';
import PhotoUploadForm from '../../components/photoReportForm/photoReportForm';
import ExpenseForm from '../../components/expenseReportForm/expenseReportForm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

const colors = ['#83E8E1', '#AAD1F9', '#D3D3FB', '#FEBED6'];

interface ReportFormProps {
  open: boolean;
  handleClose: () => void;
  eventName: string;
  startTime: string;
  eventId: number;
  onReportSubmitted: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ open, handleClose, eventName, startTime, eventId, onReportSubmitted }) => {
  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [openQuestionsModal, setOpenQuestionsModal] = useState(false);
  const [openPhotoUploadModal, setOpenPhotoUploadModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [inventoryFilled, setInventoryFilled] = useState(false);
  const [questionsFilled, setQuestionsFilled] = useState(false);
  const [photosFilled, setPhotosFilled] = useState(false);
  const [expensesFilled, setExpensesFilled] = useState(false);
  const [noPhotos, setNoPhotos] = useState(false);
  const [noExpenses, setNoExpenses] = useState(false);

  const handleOpenInventoryModal = () => {
    setOpenInventoryModal(true);
  };

  const handleCloseInventoryModal = () => {
    setOpenInventoryModal(false);
  };

  const handleInventoryComplete = () => {
    setInventoryFilled(true);
    handleCloseInventoryModal();
  };

  const handleOpenQuestionsModal = () => {
    setOpenQuestionsModal(true);
  };

  const handleCloseQuestionsModal = () => {
    setOpenQuestionsModal(false);
  };

  const handleQuestionsComplete = () => {
    setQuestionsFilled(true);
    handleCloseQuestionsModal();
  };

  const handleOpenPhotoUploadModal = () => {
    setOpenPhotoUploadModal(true);
  };

  const handleClosePhotoUploadModal = () => {
    setOpenPhotoUploadModal(false);
  };

  const handlePhotoUploadComplete = () => {
    setPhotosFilled(true);
    handleClosePhotoUploadModal();
  };

  const handleOpenExpenseModal = () => {
    setOpenExpenseModal(true);
  };

  const handleCloseExpenseModal = () => {
    setOpenExpenseModal(false);
  };

  const handleExpenseComplete = () => {
    setExpensesFilled(true);
    handleCloseExpenseModal();
  };

  const handleNoPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoPhotos(event.target.checked);
    if (event.target.checked) {
      setPhotosFilled(true);
    } else {
      setPhotosFilled(false);
    }
  };

  const handleNoExpensesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoExpenses(event.target.checked);
    if (event.target.checked) {
      setExpensesFilled(true);
    } else {
      setExpensesFilled(false);
    }
  };

  const handleSubmit = async () => {
    const data = {
      eventId,
      inventoryFilled,
      questionsFilled,
      photosFilled,
      expensesFilled,
    };
  
    try {
      const response = await fetch('http://localhost:5000/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      console.log('Report successfully submitted');
      onReportSubmitted();
      handleClose();
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
    }
  };

  const isSubmitDisabled = !inventoryFilled || !questionsFilled || !photosFilled || !expensesFilled;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
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
        <Grid item container spacing={2} flex={1} xs={12} md={7} alignSelf="center">
          {[
            { text: 'Fill out Inventory & Sales Data', filled: inventoryFilled, onClick: handleOpenInventoryModal },
            { text: 'Answer Report Questions', filled: questionsFilled, onClick: handleOpenQuestionsModal },
            { text: 'Attach Photos', filled: photosFilled, onClick: handleOpenPhotoUploadModal },
            { text: 'Attach Expenses', filled: expensesFilled, onClick: handleOpenExpenseModal }
          ].map((item, index) => (
            <Grid item xs={12} key={index}>
              <Box display="flex" alignItems="center">
                <ButtonBase onClick={item.onClick} style={{ width: '50%' }}>
                  <Card sx={{
                    width: '100%',
                    height: '150px',
                    borderLeft: `10px solid ${colors[index]}`,
                    backgroundColor: item.filled ? colors[index] : 'inherit'
                  }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <Typography variant="h1" style={{ marginRight: '16px', fontWeight: 'bold', color: item.filled ? 'white' : colors[index] }}>
                          {index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="h6" style={{ color: item.filled ? 'black' : 'inherit' }}>{item.text}</Typography>
                        </Box>
                        {item.filled && <CheckCircleIcon sx={{ color: 'white', marginLeft: 'auto' }} />}
                      </Box>
                    </CardContent>
                  </Card>
                </ButtonBase>
                <Box ml={2} flex={1} display="flex" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    {index === 0 && 'Let your manager know how productive this store and time were for you!'}
                    {index === 1 && 'Showcase your amazing powers of observation to let us know how your demo went.'}
                    {index === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        Show us how awesome your setup was.
                        <FormControlLabel
                          control={<Checkbox checked={noPhotos} onChange={handleNoPhotosChange} />}
                          label="No photos to add"
                        />
                      </div>
                    )}
                    {index === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        Any expenses related to this event.
                        <FormControlLabel
                          control={<Checkbox checked={noExpenses} onChange={handleNoExpensesChange} />}
                          label="No expenses to add"
                        />
                      </div>
                    )}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box mt={3} flex={1} width="100%" display="flex" justifyContent="center">
          <Box width="60%">
            <Typography variant="h6" mb={1}>Message to your manager:</Typography>
            <textarea style={{ width: '100%', height: '60px', padding: '10px' }} placeholder="Leave your comments about the report here" />
          </Box>
        </Box>
        <Box mt={3} display="flex" width="100%" justifyContent='center'>
        <Button
            variant="contained"
            color="secondary"
            style={{ margin: '10px', backgroundColor: isSubmitDisabled ? 'grey' : 'blue' }}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            Submit
          </Button>
          <Button variant="outlined" onClick={handleClose} style={{ margin: '10px' }}>Close</Button>
        </Box>
        <InventorySalesDataForm open={openInventoryModal} handleClose={handleCloseInventoryModal} eventId={eventId} onComplete={handleInventoryComplete} />
        <ReportQuestionsForm open={openQuestionsModal} handleClose={handleCloseQuestionsModal} eventId={eventId} eventName={eventName} startTime={startTime} onComplete={handleQuestionsComplete} />
        <PhotoUploadForm open={openPhotoUploadModal} handleClose={handleClosePhotoUploadModal} eventId={eventId} onComplete={handlePhotoUploadComplete} />
        <ExpenseForm open={openExpenseModal} handleClose={handleCloseExpenseModal} eventId={eventId} eventName={eventName} startTime={startTime} onComplete={handleExpenseComplete} />
      </Paper>
    </Modal>
  );
};

export default ReportForm;
