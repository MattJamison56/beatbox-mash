/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton, Grid, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { ArrowUpward, Close } from '@mui/icons-material';
const apiUrl = import.meta.env.VITE_API_URL;

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '1000px',
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
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', String(eventId));
    formData.append('ba_id', localStorage.getItem('user_id'));

    try {
      const response = await fetch(`${apiUrl}/reports/photos`, {
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
          <IconButton onClick={handleClose} aria-label="close" sx={{ position: 'absolute', top: '10px', right: '10px' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box {...getRootProps()} className="dropzone" style={{ display: 'flex', border: '2px dashed #cccccc', textAlign: 'center', 
            alignSelf: 'center', maxWidth: "400px", maxHeight: "200px", justifyContent: "center", padding: '100px' }}>
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

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading}
          sx={{ mt: 2, marginTop: '0px' }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Paper>
    </Modal>
  );
};

export default PhotoReportForm;
