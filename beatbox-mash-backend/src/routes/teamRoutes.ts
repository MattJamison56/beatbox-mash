import express from 'express';
import { createTeam, getTeams } from '../controllers/teamController';

const router = express.Router();

router.get('/', getTeams);
router.post('/create', createTeam);

export default router;
