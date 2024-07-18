// routes/accountRoutes.ts
import express from 'express';
import { sendAccountCreationEmail, setPassword, saveProfileInfo } from '../controllers/accountController';
import { authenticateToken } from '../controllers/authController';

const router = express.Router();

router.post('/create-account', sendAccountCreationEmail);
router.post('/set-password', setPassword);
router.post('/save-info', authenticateToken, saveProfileInfo)

export default router;
