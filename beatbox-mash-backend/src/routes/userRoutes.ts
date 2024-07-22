import express from 'express';
import { getManagersWithTeams, updateManagerTeams, deleteManager } from '../controllers/userController';

const router = express.Router();

router.get('/managers', getManagersWithTeams);
router.post('/managers/updateTeams', updateManagerTeams);
router.post('/managers/delete', deleteManager);

export default router;
