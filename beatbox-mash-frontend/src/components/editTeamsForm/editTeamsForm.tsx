import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { useState, useEffect } from 'react';

type EditTeamsFormProps = {
  open: boolean;
  onClose: () => void;
  currentTeams: string | string[];
  entityId: string | null;
  teams: string[];
  onSave: (entityId: string | null, newTeams: string[]) => void;
};

export const EditTeamsForm: React.FC<EditTeamsFormProps> = ({ open, onClose, currentTeams, entityId, teams, onSave }) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(Array.isArray(currentTeams) ? currentTeams : currentTeams.split(', '));

  useEffect(() => {
    if (open) {
      setSelectedTeams(Array.isArray(currentTeams) ? currentTeams : currentTeams.split(', '));
    }
  }, [open, currentTeams]);

  const handleSave = () => {
    onSave(entityId, selectedTeams);
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
