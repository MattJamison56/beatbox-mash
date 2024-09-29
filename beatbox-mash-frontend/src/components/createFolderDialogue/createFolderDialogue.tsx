// components/CreateFolderDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';

const apiUrl = import.meta.env.VITE_API_URL;

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentFolderId: number | null;
  onFolderCreated: () => void;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  parentFolderId,
  onFolderCreated,
}) => {
  const [folderName, setFolderName] = useState('');

  const handleCreate = async () => {
    try {
      const response = await fetch(`${apiUrl}/training/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, parentFolderId }),
      });

      if (response.ok) {
        onFolderCreated();
        setFolderName('');
        onClose();
      } else {
        console.error('Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        <TextField
          label="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
