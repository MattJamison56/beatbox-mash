import express from 'express';
import { saveInventorySalesData, getInventorySalesData, getReportQuestionsData, saveReportQuestionsData, uploadPhotos } from '../controllers/reportController';

const router = express.Router();

router.post('/saveInventorySalesData', saveInventorySalesData);
router.get('/getInventorySalesData/:eventId', getInventorySalesData);

router.get('/getReportQuestionsData/:eventId', getReportQuestionsData);
router.post('/saveReportQuestionsData', saveReportQuestionsData);

router.post('/photos', uploadPhotos)

export default router;