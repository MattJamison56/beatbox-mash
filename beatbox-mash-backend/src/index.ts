import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { poolPromise } from './database';
import ambassadorRoutes from './routes/ambassadorRoutes';
import teamRoutes from './routes/teamRoutes'
import bodyParser from 'body-parser';
import venueRoutes from './routes/venueRoutes';
import productRoutes from './routes/productRoutes';
import campaignRoutes from './routes/campaignRoutes';
import eventRoutes from './routes/eventRoutes';
import accountRoutes from './routes/accountRoutes';
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import pdfRoutes from './routes/pdfRoutes';
import excelRoutes from './routes/excelRoutes';
import fileUpload from 'express-fileupload';
import { authenticateToken, getUserProfile } from './controllers/authController';
import path from 'path';
import paymentRoutes from './routes/paymentRoutes';
import statsRoutes from './routes/statsRoutes';
import dataRoutes from './routes/dataRoutes';
import trainingRoutes from './routes/trainingRoutes';

//vars deployed4

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// app.use(async (req, res, next) => {
//     try {
//       await refreshGmailToken();
//       next();
//     } catch (error) {
//       res.status(500).send('Failed to refresh Gmail token');
//     }
//   });
  
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Use environment variable for production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }));  
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.use('/', userRoutes);

app.use('/account', accountRoutes);

app.get('/profile', authenticateToken, getUserProfile);

app.use('/auth', authRoutes);

app.use(bodyParser.json());
app.use('/ambassadors', ambassadorRoutes);

app.use('/teams', teamRoutes);

app.use('/venues', venueRoutes);

app.use('/products', productRoutes);

app.use('/campaigns', campaignRoutes);

app.use('/events', eventRoutes);

app.use('/reports', reportRoutes);

app.use('/pdf', pdfRoutes);

app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

app.use('/excel', excelRoutes);

app.use('/payments', paymentRoutes);

app.use('/stats', statsRoutes);

app.use('/data', dataRoutes);

app.use('/training', trainingRoutes);

app.get('/', (req, res) => res.send('API is running'));

// Error handling middleware should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));