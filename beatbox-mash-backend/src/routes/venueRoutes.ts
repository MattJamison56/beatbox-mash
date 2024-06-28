import express from 'express';
import { createVenue, deleteVenue, getVenuesWithTeams, updateVenueTeams, updateVenue } from '../controllers/venueController';

const router = express.Router();

router.get('/', getVenuesWithTeams);
router.post('/createvenue', createVenue);
router.post('/deletevenue', deleteVenue);
router.post('/updatevenueteams', updateVenueTeams);
router.post('/updatevenue', updateVenue);

export default router;
