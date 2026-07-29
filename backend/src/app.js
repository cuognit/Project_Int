import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
