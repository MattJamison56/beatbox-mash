import express from 'express';
import { createEvent, getEvents, deleteEvent, notifyAmbassadors, getMyEvents } from '../controllers/eventController';

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.delete('/delete', deleteEvent);
router.post('/notifybas', notifyAmbassadors);
router.get('/myevents/:ba_id', getMyEvents);

export default router;
