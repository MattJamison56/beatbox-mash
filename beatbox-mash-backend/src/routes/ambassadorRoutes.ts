import express from 'express';
import { createAmbassadors, deleteAmbassador, updateAmbassadorTeams, editAmbassadorWage } from '../controllers/ambassadorController';

const router = express.Router();

router.post('/createba', createAmbassadors);
router.post('/deleteba', deleteAmbassador);
router.post('/updateBATeams', updateAmbassadorTeams)
router.post('/updateBAWage', editAmbassadorWage)

export default router;
