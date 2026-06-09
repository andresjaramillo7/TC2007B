import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import routes from './routes';
import { swaggerServe, swaggerSetup, swaggerDocument } from './config/swagger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '1mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api/docs', swaggerServe, swaggerSetup);
app.get('/api/docs.json', (_req, res) => res.json(swaggerDocument));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
