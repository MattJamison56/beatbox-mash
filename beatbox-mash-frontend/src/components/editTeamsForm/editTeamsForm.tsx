import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { useState, useEffect } from 'react';

type EditTeamsFormProps = {
  open: boolean;
  onClose: () => void;
  currentTeams: string[];
  userId: string | null;
  teams: string[];
  onSave: (userId: string | null, newTeams: string[]) => void;
};

export const EditTeamsForm: React.FC<EditTeamsFormProps> = ({ open, onClose, currentTeams, userId, teams, onSave }) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(currentTeams);

  useEffect(() => {
    if (open) {
      setSelectedTeams(currentTeams);
    }
  }, [open, currentTeams]);

  const handleSave = () => {
    onSave(userId, selectedTeams);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Teams</DialogTitle>
      <DialogContent>
        <Autocomplete
          multiple
          options={teams}
          value={selectedTeams}
          onChange={(_e, value) => setSelectedTeams(value)}
          renderInput={(params) => <TextField {...params} label="Teams" style={{ marginTop: 5 }}/>}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};
