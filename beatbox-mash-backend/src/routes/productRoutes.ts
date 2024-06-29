import express from 'express';
import { getProducts, createProducts, deleteProduct } from '../controllers/productController';

const router = express.Router();

router.get('/', getProducts);
router.post('/create', createProducts);
router.post('/delete', deleteProduct);

export default router;
