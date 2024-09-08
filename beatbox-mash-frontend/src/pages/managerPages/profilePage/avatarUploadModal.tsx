/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { Modal, Paper, Typography, Button, IconButton, Box, Slider } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';

const apiUrl = import.meta.env.VITE_API_URL;

interface AvatarUploadModalProps {
  open: boolean;
  handleClose: () => void;
  userId?: number;
  fetchUserProfile: () => void;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ open, handleClose, userId, fetchUserProfile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(acceptedFiles[0]);
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    if (!file || !userId || !croppedAreaPixels) return;

    setUploading(true);

    try {
      // Get cropped image blob
      const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels);

      // Prepare cropped image for upload
      const formData = new FormData();
      formData.append('files', croppedImage);
      formData.append('userId', userId.toString());

      const response = await fetch(`${apiUrl}/upload-avatar`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        const newAvatarUrl = responseData.avatarUrl;

        localStorage.setItem('avatar_url', newAvatarUrl);

        fetchUserProfile();

        handleClose();
      } else {
        console.error('Error uploading avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Paper sx={{ ...modalStyle, padding: '20px' }}>
        <Typography variant="h5" mb={2}>Upload New Avatar</Typography>
        {!imageSrc ? (
          <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', justifyContent: "center", padding: '100px', textAlign: 'center', cursor: 'pointer' }}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <Typography>Drop the image here...</Typography>
            ) : (
              <Typography>Drag & drop an image here, or click to select one</Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '400px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                style={{
                  containerStyle: { width: '100%', height: '100%' },
                  cropAreaStyle: { borderRadius: '50%' },
                }}
              />
            </Box>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e, zoom) => setZoom(zoom as number)}
              sx={{ mt: 2, maxWidth: '300px' }}
            />
          </Box>
        )}
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={uploading || !imageSrc}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Close />
        </IconButton>
      </Paper>
    </Modal>
  );
};

const modalStyle = {
  display: 'flex',
  flexDirection: 'column',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '600px',
  width: '100%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  alignItems: 'center',
};

export default AvatarUploadModal;
