import express from 'express';
import { getProductData, getSalesSummary } from '../controllers/dataController';

const router = express.Router();

router.get('/product-data', getProductData);
router.get('/sales-summary', getSalesSummary);

export default router;
