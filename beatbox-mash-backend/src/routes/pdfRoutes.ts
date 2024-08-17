import express from 'express';
import { generateReportPDF, getEventPdf } from '../controllers/pdfController';

const router = express.Router();

router.get('/generateReport/:eventId', generateReportPDF);
router.get('/getpdf/:eventId', getEventPdf);


export default router;
