import express from 'express';
import { getEventStages } from '../controllers/statsController';

const router = express.Router();

router.get('/event-stages', getEventStages);


export default router;
