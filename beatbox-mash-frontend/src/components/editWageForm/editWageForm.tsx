import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useState, useEffect } from 'react';

type EditWageFormProps = {
  open: boolean;
  onClose: () => void;
  currentWage: number;
  userId: string | null;
  onSave: (userId: string | null, newWage: number) => void;
};

export const EditWageForm: React.FC<EditWageFormProps> = ({ open, onClose, currentWage, userId, onSave }) => {
  const [newWage, setNewWage] = useState<number>(currentWage);

  useEffect(() => {
    if (open) {
      setNewWage(currentWage);
    }
  }, [open, currentWage]);

  const handleSave = () => {
    onSave(userId, newWage);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Wage</DialogTitle>
      <DialogContent>
        <TextField
          label="Wage ($/hour)"
          type="number"
          fullWidth
          value={newWage}
          onChange={(e) => setNewWage(parseFloat(e.target.value))}
          style={{ marginTop: 5 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};
