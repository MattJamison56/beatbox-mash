/* eslint-disable react-hooks/exhaustive-deps */
// components/questionList/QuestionList.tsx
import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QuestionForm from '../questionForm/questionForm';

const apiUrl = import.meta.env.VITE_API_URL;

interface Option {
  optionId?: number;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  questionId: number;
  questionText: string;
  options: Option[];
}

interface QuestionListProps {
  materialId: number;
}

const QuestionList: React.FC<QuestionListProps> = ({ materialId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${apiUrl}/training/materials/${materialId}/questions`);
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [materialId]);

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setOpenForm(true);
  };

  const handleDelete = async (questionId: number) => {
    try {
      await fetch(`${apiUrl}/training/questions/${questionId}`, {
        method: 'DELETE',
      });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setEditingQuestion(null);
    fetchQuestions();
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpenForm(true)}>
        Add Question +
      </Button>
      <List>
        {questions.map((question) => (
          <ListItem
            key={question.questionId}
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <Box display="flex" alignItems="center" width="100%">
              <ListItemText primary={question.questionText} style={{ color: 'black' }}/>
              <IconButton onClick={() => handleEdit(question)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDelete(question.questionId)}>
                <DeleteIcon />
              </IconButton>
            </Box>
            {/* Display options */}
            <List disablePadding>
              {question.options.map((option) => (
                <ListItem key={option.optionId} style={{ paddingLeft: '16px' }}>
                  <Typography
                    variant="body2"
                    style={{
                      color: option.isCorrect ? 'green' : 'black',
                      fontWeight: option.isCorrect ? 'bold' : 'normal',
                      opacity: option.isCorrect ? 0.6 : 1,
                    }}
                  >
                    {option.optionText}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </ListItem>
        ))}
      </List>
      {openForm && (
        <Dialog open={openForm} onClose={handleFormClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
          <DialogContent>
            <QuestionForm
              materialId={materialId}
              question={editingQuestion}
              onClose={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default QuestionList;
