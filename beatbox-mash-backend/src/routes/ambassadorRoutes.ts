import express from 'express';
import { createAmbassadors, deleteAmbassador } from '../controllers/ambassadorController';

const router = express.Router();

router.post('/createba', createAmbassadors);
router.post('/deleteba', deleteAmbassador);

export default router;
