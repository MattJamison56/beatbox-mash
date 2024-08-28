import express from 'express';
import { saveInventorySalesData, getInventorySalesData, getReportQuestionsData, saveReportQuestionsData, uploadPhotos, uploadReceipts, saveMileageReport, saveOtherExpense, submitAndGenerateReport, partialSubmit } from '../controllers/reportController';

const router = express.Router();

router.post('/saveInventorySalesData', saveInventorySalesData);
router.get('/getInventorySalesData/:eventId', getInventorySalesData);

router.get('/getReportQuestionsData/:eventId', getReportQuestionsData);
router.post('/saveReportQuestionsData', saveReportQuestionsData);

router.post('/photos', uploadPhotos);
router.post('/receipts', uploadReceipts);
router.post('/mileage', saveMileageReport);
router.post('/other', saveOtherExpense);

router.post('/submit', submitAndGenerateReport);
router.post('/partialSubmit', partialSubmit);

export default router;