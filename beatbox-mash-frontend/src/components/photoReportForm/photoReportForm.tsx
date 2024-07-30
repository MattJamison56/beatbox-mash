/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxHeight: '80%',
  bgcolor: 'background.paper',
  p: 4,
  outline: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'auto',
  backgroundColor: '#FCFCFC',
};

interface PhotoReportFormProps {
  open: boolean;
  handleClose: () => void;
  eventId: number;
  onComplete: () => void;
}

const PhotoReportForm: React.FC<PhotoReportFormProps> = ({ open, handleClose, eventId, onComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', String(eventId));

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onComplete();
        handleClose();
      } else {
        console.error('Error uploading files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="photo-upload-modal-title" aria-describedby="photo-upload-modal-description">
      <Paper sx={modalStyle}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Typography variant="h5">Attach Photos</Typography>
          <IconButton onClick={handleClose} aria-label="close" style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <input type="file" multiple onChange={handleFileChange} />
          {selectedFiles.length > 0 && (
            <Box mt={2}>
              {selectedFiles.map((file, index) => (
                <Typography key={index}>{file.name}</Typography>
              ))}
            </Box>
          )}
        </Box>
        <Box mt={3} display="flex" justifyContent="center">
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default PhotoReportForm;
