import express from 'express';
import { createEvent } from '../controllers/eventController';

const router = express.Router();

// router.get('/', getEvents);
router.post('/create', createEvent);
// router.post('/delete', deleteEvent);

export default router;
