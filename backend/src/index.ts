import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import storeRoutes from './routes/storeRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import transactionRoutes from './routes/transactionRoutes';
import stockRoutes from './routes/stockRoutes';
import systemRoutes from './routes/systemRoutes';

dotenv.config();

export const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.send('Coin Exchange API is running');
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/system', systemRoutes);

// Only listen when not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}
