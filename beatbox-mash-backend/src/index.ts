import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { poolPromise } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', userRoutes);

app.get('/', (req, res) => res.send('API is running'));

// Error handling middleware should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
