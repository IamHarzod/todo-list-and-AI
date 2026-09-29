import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import taskRouter from './routes/tasks';
import aiRouter from './routes/ai';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', taskRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`🚀 TaskAI Server running at http://localhost:${port}`);
});
