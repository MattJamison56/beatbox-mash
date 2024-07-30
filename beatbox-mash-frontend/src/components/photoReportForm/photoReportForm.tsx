/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect } from 'react';
import { Box, Modal, Paper, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDropzone } from 'react-dropzone';
import { ArrowUpward, Close } from '@mui/icons-material';

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
  const [files, setFiles] = useState<any[]>([]);
  const [rejected, setRejected] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

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
      setRejected(previousFiles => [...previousFiles, ...rejectedFiles]);
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
    // Revoke the data URIs to avoid memory leaks
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (name: string) => {
    setFiles(files => files.filter(file => file.name !== name));
  };

  const removeAll = () => {
    setFiles([]);
    setRejected([]);
  };

  const removeRejected = (name: string) => {
    setRejected(files => files.filter(({ file }) => file.name !== name));
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('eventId', String(eventId));

    try {
      const response = await fetch('http://localhost:5000/reports/photos', {
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
        <Box {...getRootProps()} className="dropzone" style={{ border: '2px dashed #cccccc', padding: '20px', textAlign: 'center' }}>
          <input {...getInputProps()} />
          <div className='flex flex-col items-center justify-center gap-4'>
            <ArrowUpward className='w-5 h-5' />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag & drop files here, or click to select files</p>
            )}
          </div>
        </Box>

        {/* Preview */}
        <section className='mt-10'>
          <div className='flex gap-4'>
            <h2 className='title text-3xl font-semibold'>Preview</h2>
            <button
              type='button'
              onClick={removeAll}
              className='mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-secondary-400 rounded-md px-3 hover:bg-secondary-400 hover:text-white transition-colors'
            >
              Remove all files
            </button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
              className='ml-auto mt-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-purple-400 rounded-md px-3 hover:bg-purple-400 hover:text-white transition-colors'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>

          {/* Accepted files */}
          <h3 className='title text-lg font-semibold text-neutral-600 mt-10 border-b pb-3'>
            Accepted Files
          </h3>
          <ul className='mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-10'>
            {files.map(file => (
              <li key={file.name} className='relative h-32 rounded-md shadow-lg'>
                <img
                  src={file.preview}
                  alt={file.name}
                  width={100}
                  height={100}
                  onLoad={() => {
                    URL.revokeObjectURL(file.preview);
                  }}
                  className='h-full w-full object-contain rounded-md'
                />
                <button
                  type='button'
                  className='w-7 h-7 border border-secondary-400 bg-secondary-400 rounded-full flex justify-center items-center absolute -top-3 -right-3 hover:bg-white transition-colors'
                  onClick={() => removeFile(file.name)}
                >
                  <Close className='w-5 h-5 fill-white hover:fill-secondary-400 transition-colors' />
                </button>
                <p className='mt-2 text-neutral-500 text-[12px] font-medium'>
                  {file.name}
                </p>
              </li>
            ))}
          </ul>

          {/* Rejected Files */}
          <h3 className='title text-lg font-semibold text-neutral-600 mt-24 border-b pb-3'>
            Rejected Files
          </h3>
          <ul className='mt-6 flex flex-col'>
            {rejected.map(({ file, errors }) => (
              <li key={file.name} className='flex items-start justify-between'>
                <div>
                  <p className='mt-2 text-neutral-500 text-sm font-medium'>
                    {file.name}
                  </p>
                  <ul className='text-[12px] text-red-400'>
                    {errors.map((error: any) => (
                      <li key={error.code}>{error.message}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type='button'
                  className='mt-1 py-1 text-[12px] uppercase tracking-wider font-bold text-neutral-500 border border-secondary-400 rounded-md px-3 hover:bg-secondary-400 hover:text-white transition-colors'
                  onClick={() => removeRejected(file.name)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </Paper>
    </Modal>
  );
};

export default PhotoReportForm;
