import express from 'express';
import { getPaymentHistory, markAllAsPaid, getPaymentDetailsById } from '../controllers/paymentController';

const router = express.Router();

router.get('/history', getPaymentHistory);
router.post('/markallaspaid/:payrollGroup', markAllAsPaid);
router.get('/details/:id', getPaymentDetailsById);

export default router;
