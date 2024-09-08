import express from 'express';
import { getManagersWithTeams, updateManagerTeams, deleteManager } from '../controllers/userController';
import { uploadUserAvatar } from '../controllers/accountController';
import multer from 'multer';

const router = express.Router();


router.get('/managers', getManagersWithTeams);
router.post('/managers/updateTeams', updateManagerTeams);
router.post('/managers/delete', deleteManager);
router.post('/upload-avatar', uploadUserAvatar);

export default router;
