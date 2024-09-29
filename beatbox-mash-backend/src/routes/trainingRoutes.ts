// routes/training.ts
import express from 'express';
import { createFolder, getFolders,uploadTrainingMaterial, getMaterials } from '../controllers/trainingController';

const router = express.Router();

router.post('/materials', uploadTrainingMaterial);
router.get('/materials', getMaterials);
router.post('/folders', createFolder);
router.get('/folders', getFolders);

// Export the router
export default router;
