import React, { useState } from 'react';
import { Box, Typography, Modal, Paper, IconButton, Card, CardContent, Grid, ButtonBase, Button, Checkbox, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InventorySalesDataForm from '../../components/inventorySalesDataForm/inventorySalesDataForm';

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
}

const ReportForm: React.FC<ReportFormProps> = ({ open, handleClose, eventName, startTime }) => {
  const [openInventoryModal, setOpenInventoryModal] = useState(false);

  const handleOpenInventoryModal = () => {
    setOpenInventoryModal(true);
  };

  const handleCloseInventoryModal = () => {
    setOpenInventoryModal(false);
  };

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
          {['Fill out Inventory & Sales Data', 'Answer Report Questions', 'Attach Photos', 'Attach Expenses'].map((text, index) => (
            <Grid item xs={12} key={index}>
              <Box display="flex" alignItems="center">
                <ButtonBase onClick={index === 0 ? handleOpenInventoryModal : () => alert(`${text}`)} style={{ width: '50%' }}>
                  <Card sx={{ width: '100%', height: '150px', borderLeft: `10px solid ${colors[index]}` }}>
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        <Typography variant="h1" style={{ marginRight: '16px', fontWeight: 'bold', color: colors[index] }}>{index + 1}</Typography>
                        <Box>
                          <Typography variant="h6">{text}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </ButtonBase>
                <Box ml={2} flex={1} display="flex" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    {index === 0 && 'Let your manager know how productive this store and time were for you!'}
                    {index === 1 && 'Showcase your amazing powers of observation to let us know how your demo went.'}
                    {index === 2 && (
                      <div style={{display:'flex', flexDirection:'column'}}>
                        Show us how awesome your setup was.
                        <FormControlLabel control={<Checkbox />} label="No photos to add" />
                      </div>
                    )}
                    {index === 3 && (
                      <div style={{display:'flex', flexDirection:'column'}}>
                        Any expenses related to this event.
                        <FormControlLabel control={<Checkbox />} label="No expenses to add" />
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
          <Button variant="contained" color="secondary" style={{margin: '10px'}}>Submit Report</Button>
          <Button variant="outlined" onClick={handleClose} style={{margin: '10px'}}>Close</Button>
        </Box>
        <InventorySalesDataForm open={openInventoryModal} handleClose={handleCloseInventoryModal} />
      </Paper>
    </Modal>
  );
};

export default ReportForm;
