import express from 'express';
import { getProductData, getSalesSummary, getBrandAmbassadorsData, getVenueData, getStateData, getQANumericalResults, exportProductDataToExcel, exportBrandAmbassadorsDataToExcel } from '../controllers/dataController';

const router = express.Router();

router.get('/product-data', getProductData);
router.get('/sales-summary', getSalesSummary);
router.get('/ba-data', getBrandAmbassadorsData);
router.get('/venue-data', getVenueData);
router.get('/state-data', getStateData);
router.get('/qa-numerical-results', getQANumericalResults);
router.get('/export-product-data', exportProductDataToExcel);
router.get('/export-ba-data', exportBrandAmbassadorsDataToExcel);

export default router;
