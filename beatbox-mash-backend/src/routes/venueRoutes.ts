import express from 'express';
import { createVenue, deleteVenue, getVenues } from '../controllers/venueController';

const router = express.Router();

router.get('/', getVenues);
router.post('/createvenue', createVenue);
router.post('/deletevenue', deleteVenue);

export default router;
