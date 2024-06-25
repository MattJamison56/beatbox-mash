import express from 'express';
import { createAmbassadors, deleteAmbassador, updateAmbassadorTeams } from '../controllers/ambassadorController';

const router = express.Router();

router.post('/createba', createAmbassadors);
router.post('/deleteba', deleteAmbassador);
router.post('/updateBATeams', updateAmbassadorTeams)
export default router;
