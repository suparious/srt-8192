import express from 'express';
import winston from 'winston';
import dotenv from 'dotenv';
import * as tf from '@tensorflow/tfjs-node';
import { BehaviourModel } from './models/BehaviourModel';
import { OpponentAI } from './opponent/OpponentAI';

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();
const port = process.env.PORT || 5002;

app.use(express.json());

// Initialize AI models
const behaviorModel = new BehaviourModel();
const opponentAI = new OpponentAI({} as any); // TODO: Add proper game state type

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// AI endpoints
app.post('/api/predict-action', async (req, res) => {
  try {
    const action = opponentAI.generateNextAction();
    res.json({ action });
  } catch (error) {
    logger.error('Error predicting action:', error);
    res.status(500).json({ error: 'Failed to predict action' });
  }
});

app.post('/api/update-behavior', async (req, res) => {
  try {
    const { gameState } = req.body;
    opponentAI.updateState(gameState);
    res.json({ status: 'updated' });
  } catch (error) {
    logger.error('Error updating behavior:', error);
    res.status(500).json({ error: 'Failed to update behavior' });
  }
});

app.listen(port, () => {
  logger.info(`AI Service running on port ${port}`);
});

export { app, logger };