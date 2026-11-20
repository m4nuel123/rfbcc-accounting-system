import express from 'express';
import { createErpBackendRouter } from '../server/erpBackend';

const app = express();
app.use('/api', createErpBackendRouter());

export default app;
