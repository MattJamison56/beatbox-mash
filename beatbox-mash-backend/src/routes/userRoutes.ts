import express from 'express';
import { getManagersWithTeams, updateManagerTeams, deleteManager, updateUserAvailability, getUserAvailability, getMyDocuments, uploadDocument } from '../controllers/userController';
import { uploadUserAvatar } from '../controllers/accountController';
import multer from 'multer';

const router = express.Router();


router.get('/managers', getManagersWithTeams);
router.post('/managers/updateTeams', updateManagerTeams);
router.post('/managers/delete', deleteManager);
router.post('/upload-avatar', uploadUserAvatar);
router.get('/users/:userId/availability', getUserAvailability);
router.post('/users/:userId/availability', updateUserAvailability);
router.get('/docs/:ba_id', getMyDocuments);
router.post('/upload-doc', uploadDocument);

export default router;
