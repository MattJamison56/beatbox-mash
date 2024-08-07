import express from 'express';
import { generateReportPDF } from '../controllers/pdfController';

const router = express.Router();

router.get('/generateReport/:eventId', generateReportPDF);

export default router;
