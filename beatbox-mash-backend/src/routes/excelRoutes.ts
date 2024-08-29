import express from 'express';
import { exportPayrollToExcel } from '../controllers/excelController';

const router = express.Router();

router.get('/export/:activeTab', exportPayrollToExcel);

export default router;
