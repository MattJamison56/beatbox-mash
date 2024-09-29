import React, { useState } from 'react';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import axios, { AxiosProgressEvent } from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

interface UploadFormProps {
  folderId: number | null;
  onUploadSuccess: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ folderId, onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file || !folderId) return;

    const formData = new FormData();
    formData.append('folderId', folderId.toString());
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const response = await axios.post(`${apiUrl}/training/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      if (response.status === 201) {
        onUploadSuccess();
        setTitle('');
        setDescription('');
        setType('video');
        setFile(null);
        setUploadProgress(0);
        setUploading(false);
      } else {
        console.error('Upload failed');
        setUploadError('Upload failed');
        setUploading(false);
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      setUploadError('Error uploading material');
      setUploading(false);
    }
  };

  return (
    <div>
      <Typography variant="h6" style={{ color: 'black' }}>
        Upload Training Material
      </Typography>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Description"
        value={description}
        multiline
        rows={4}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="type-label">Type</InputLabel>
        <Select labelId="type-label" value={type} onChange={(e) => setType(e.target.value)}>
          <MenuItem value="video">Video</MenuItem>
          <MenuItem value="document">Document</MenuItem>
        </Select>
      </FormControl>
      <Button variant="contained" component="label" fullWidth sx={{ marginTop: 2 }}>
        Select File
        <input type="file" hidden onChange={handleFileChange} />
      </Button>
      {file && (
        <Typography variant="body2" style={{ color: 'black', marginTop: '8px' }}>
          {file.name}
        </Typography>
      )}

      {uploading && (
        <Box sx={{ width: '100%', marginTop: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="textSecondary">
            Uploading: {uploadProgress}%
          </Typography>
        </Box>
      )}

      {uploadError && (
        <Typography variant="body2" color="error" style={{ marginTop: '8px' }}>
          {uploadError}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        fullWidth
        sx={{ marginTop: 2 }}
        disabled={uploading}
      >
        Upload
      </Button>
    </div>
  );
};

export default UploadForm;
