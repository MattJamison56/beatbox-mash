import express from 'express';
import { getProductData, getSalesSummary, getBrandAmbassadorsData, getVenueData, getStateData } from '../controllers/dataController';

const router = express.Router();

router.get('/product-data', getProductData);
router.get('/sales-summary', getSalesSummary);
router.get('/ba-data', getBrandAmbassadorsData);
router.get('/venue-data', getVenueData);
router.get('/state-data', getStateData);

export default router;
