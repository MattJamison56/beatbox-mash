// routes/accountRoutes.ts
import express from 'express';
import { sendAccountCreationEmail, setPassword } from '../controllers/accountController';

const router = express.Router();

router.post('/create-account', sendAccountCreationEmail);
router.post('/set-password', setPassword);

export default router;
