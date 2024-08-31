import express from 'express';
import { getPaymentDetailsByPayrollGroup, getPaymentHistory, markAllAsPaid } from '../controllers/paymentController';

const router = express.Router();

router.get('/history', getPaymentHistory);
router.post('/markallaspaid/:payrollGroup', markAllAsPaid);
router.get('/details/:payrollGroup', getPaymentDetailsByPayrollGroup);

export default router;
