import express from 'express';
import { saveInventorySalesData, getInventorySalesData, getReportQuestionsData, saveReportQuestionsData, uploadPhotos, uploadReceipts } from '../controllers/reportController';

const router = express.Router();

router.post('/saveInventorySalesData', saveInventorySalesData);
router.get('/getInventorySalesData/:eventId', getInventorySalesData);

router.get('/getReportQuestionsData/:eventId', getReportQuestionsData);
router.post('/saveReportQuestionsData', saveReportQuestionsData);

router.post('/photos', uploadPhotos);
router.post('/receipts', uploadReceipts);

export default router;