import express from 'express';
import { createEvent, getEvents, deleteEvent, notifyAmbassadors, getMyEvents, getPendingEventsForApproval, approveEvent, rejectEvent, getApprovedEvents, getEventsWithReimbursements } from '../controllers/eventController';

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.delete('/delete', deleteEvent);
router.post('/notifybas', notifyAmbassadors);
router.get('/myevents/:ba_id', getMyEvents);
router.get('/pendingreports', getPendingEventsForApproval);
router.post('/approve', approveEvent);
router.post('/reject', rejectEvent);
router.get('/approved', getApprovedEvents)
router.get('/myeventsreimbursed/:ba_id', getEventsWithReimbursements)

export default router;
