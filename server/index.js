import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import apiRoutes from './apiRoutes.js';
import { setupWebSocket } from './wsHandler.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
const cleanupWs = setupWebSocket(wss);

server.listen(PORT, () => {
  console.log(`[Server] REST API running at http://localhost:${PORT}/api`);
  console.log(`[Server] WebSocket running at ws://localhost:${PORT}/ws`);
  console.log(`[Server] Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  cleanupWs();
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});
