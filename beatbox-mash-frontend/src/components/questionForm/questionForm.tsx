/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionForm/QuestionForm.tsx
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const apiUrl = import.meta.env.VITE_API_URL;

interface Option {
  optionId?: number;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  questionId?: number;
  questionText: string;
  options: Option[];
}

interface QuestionFormProps {
  materialId: number;
  question?: Question;
  onClose: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ materialId, question, onClose }) => {
  const [questionText, setQuestionText] = useState<string>(question?.questionText || '');
  const [options, setOptions] = useState<Option[]>(
    question?.options || [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ]
  );

  const handleOptionChange = (index: number, field: string, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([...options, { optionText: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
  };

  const handleSubmit = async () => {
    const payload = {
      questionText,
      options,
    };

    try {
      if (question) {
        // Edit existing question
        await fetch(`${apiUrl}/training/questions/${question.questionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new question
        await fetch(`${apiUrl}/training/materials/${materialId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onClose();
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  return (
    <>
      <TextField
        label="Question Text"
        fullWidth
        margin="normal"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
      />
      <Typography variant="h6">Options</Typography>
      {options.map((option, index) => (
        <Box key={index} display="flex" alignItems="center" mb={1}>
          <TextField
            label={`Option ${index + 1}`}
            value={option.optionText}
            onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
            fullWidth
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={option.isCorrect}
                onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
              />
            }
            label="Correct"
            style={{ margin: '5px' }}
          />
          <IconButton onClick={() => removeOption(index)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      <Button onClick={addOption}>Add Option</Button>
      <Box mt={2}>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
        <Button onClick={onClose} style={{ marginLeft: '8px' }}>
          Cancel
        </Button>
      </Box>
    </>
  );
};

export default QuestionForm;
