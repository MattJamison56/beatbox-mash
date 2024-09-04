import express from 'express';
import { getProductData } from '../controllers/dataController';

const router = express.Router();

router.get('/product-data', getProductData);

export default router;
