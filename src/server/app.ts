import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import storeRoutes from './routes/storeRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import transactionRoutes from './routes/transactionRoutes';
import stockRoutes from './routes/stockRoutes';
import systemRoutes from './routes/systemRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api', (req, res) => {
    res.json({ status: 'Coin Exchange API is running' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/system', systemRoutes);

export default app;
