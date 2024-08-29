import express from 'express';
import { getPaymentHistory, markAllAsPaid } from '../controllers/paymentController';

const router = express.Router();

router.get('/history', getPaymentHistory);
router.post('/markallaspaid/:payrollGroup', markAllAsPaid);

export default router;
