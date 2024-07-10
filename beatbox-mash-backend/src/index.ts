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
import { authenticateToken, getUserProfile } from './controllers/authController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
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

app.get('/', (req, res) => res.send('API is running'));

// Error handling middleware should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
