// routes/training.ts
import express from 'express';
import { createFolder, getFolders,uploadTrainingMaterial, getMaterials, getMyTrainings, markTrainingAsCompleted } from '../controllers/trainingController';

const router = express.Router();

router.post('/materials', uploadTrainingMaterial);
router.get('/materials', getMaterials);
router.post('/folders', createFolder);
router.get('/folders', getFolders);
router.get('/:ba_id', getMyTrainings);
router.post('/complete', markTrainingAsCompleted);


// Export the router
export default router;
