// routes/training.ts
import express from 'express';
import { createFolder, getFolders,uploadTrainingMaterial, getMaterials, getMyTrainings, markTrainingAsCompleted, createQuestion, editQuestion, deleteQuestion, getQuestionsByMaterial, submitResponses, } from '../controllers/trainingController';

const router = express.Router();

router.post('/materials', uploadTrainingMaterial);
router.get('/materials', getMaterials);
router.post('/folders', createFolder);
router.get('/folders', getFolders);
router.get('/:ba_id', getMyTrainings);
router.post('/complete', markTrainingAsCompleted);

// Question Routes
router.post('/materials/:materialId/questions', createQuestion);
router.put('/questions/:questionId', editQuestion);
router.delete('/questions/:questionId', deleteQuestion);
router.get('/materials/:materialId/questions', getQuestionsByMaterial);
router.post('/submit-responses', submitResponses);


// Export the router
export default router;
