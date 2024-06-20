import express from 'express';
import { getUsersWithTeams } from '../controllers/userController';

const router = express.Router();

router.get('/users', getUsersWithTeams);

export default router;
