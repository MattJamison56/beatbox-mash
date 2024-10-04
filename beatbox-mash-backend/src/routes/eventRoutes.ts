import express from 'express';
import { createEvent, getEvents, deleteEvent, notifyAmbassadors, getMyEvents, getPendingEventsForApproval, approveEvent, rejectEvent, getApprovedEvents, getEventsWithReimbursements, getEventsByPayrollGroups, updatePayrollGroup, declineEvent, getBrandAmbassadorData, acceptEvent, getEventsWithAmbassadors, getEventDetails, checkIn, checkOut } from '../controllers/eventController';

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.delete('/delete', deleteEvent);
router.post('/notifybas', notifyAmbassadors);
router.get('/myevents/:ba_id', getMyEvents);
router.get('/pendingreports', getPendingEventsForApproval);
router.post('/approve', approveEvent);
router.post('/reject', rejectEvent);
router.get('/approved', getApprovedEvents);
router.get('/myeventsreimbursed/:ba_id', getEventsWithReimbursements);
router.get('/payrollgroups', getEventsByPayrollGroups);
router.post('/updatepayrollgroup', updatePayrollGroup);
router.post('/decline/:event_id', declineEvent);
router.get('/brandAmbassador/:eventId/:baId', getBrandAmbassadorData);
router.post('/accept/:event_id', acceptEvent);
router.get('/eventswithambassadors', getEventsWithAmbassadors);
router.get('/details/:eventId', getEventDetails);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

export default router;
