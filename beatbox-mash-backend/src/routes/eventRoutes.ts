import express from 'express';
import { createEvent, getEvents, deleteEvent } from '../controllers/eventController';

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.delete('/delete', deleteEvent);

export default router;
