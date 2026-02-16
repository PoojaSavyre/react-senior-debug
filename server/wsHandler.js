import { generateFeedMessage, randomInt } from './mockData.js';

const HEARTBEAT_INTERVAL = 30000;
const AUTH_TOKEN = 'valid-auth-token-2024';

function setupWebSocket(wss) {
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    const clientId = `client-${Date.now()}-${randomInt(1000, 9999)}`;

    const clientState = {
      id: clientId,
      ws,
      authenticated: false,
      heartbeatTimer: null,
      heartbeatTimeout: null,
      subscriptions: new Set(['feed']),
      messageCount: 0,
      connectedAt: Date.now(),
    };

    clients.set(clientId, clientState);
    console.log(`[WS] Client connected: ${clientId}`);

    // Send connection acknowledgment
    sendMessage(ws, {
      type: 'connection:established',
      payload: { clientId, timestamp: new Date().toISOString() },
    });

    // Request authentication
    sendMessage(ws, {
      type: 'auth:required',
      payload: { message: 'Please authenticate with a valid token' },
    });

    // Start heartbeat
    clientState.heartbeatTimer = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        sendMessage(ws, { type: 'heartbeat:ping', payload: { timestamp: Date.now() } });

        clientState.heartbeatTimeout = setTimeout(() => {
          console.log(`[WS] Heartbeat timeout for ${clientId}`);
          ws.close(4000, 'Heartbeat timeout');
        }, 5000);
      }
    }, HEARTBEAT_INTERVAL);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        clientState.messageCount++;

        handleMessage(clientState, message, clients);
      } catch (err) {
        sendMessage(ws, {
          type: 'error',
          payload: { message: 'Invalid message format', details: err.message },
        });
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[WS] Client disconnected: ${clientId} (code: ${code})`);
      clearInterval(clientState.heartbeatTimer);
      clearTimeout(clientState.heartbeatTimeout);
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for ${clientId}:`, err.message);
    });
  });

  // Broadcast feed messages to subscribed clients periodically
  const feedInterval = setInterval(() => {
    const message = generateFeedMessage();

    clients.forEach((client) => {
      if (
        client.authenticated &&
        client.ws.readyState === client.ws.OPEN &&
        client.subscriptions.has('feed')
      ) {
        sendMessage(client.ws, {
          type: 'feed:message',
          payload: message,
        });
      }
    });
  }, 3000);

  // Broadcast analytics updates
  const analyticsInterval = setInterval(() => {
    const update = {
      activeUsers: randomInt(100, 1000),
      requests: randomInt(5000, 50000),
      errorRate: (Math.random() * 5).toFixed(2),
      avgLatency: randomInt(50, 500),
      timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
      if (
        client.authenticated &&
        client.ws.readyState === client.ws.OPEN &&
        client.subscriptions.has('analytics')
      ) {
        sendMessage(client.ws, {
          type: 'analytics:update',
          payload: update,
        });
      }
    });
  }, 5000);

  // Cleanup on server shutdown
  return () => {
    clearInterval(feedInterval);
    clearInterval(analyticsInterval);
    clients.forEach((client) => {
      clearInterval(client.heartbeatTimer);
      clearTimeout(client.heartbeatTimeout);
      client.ws.close(1001, 'Server shutting down');
    });
    clients.clear();
  };
}

function handleMessage(clientState, message, clients) {
  const { ws } = clientState;
  const { type, payload } = message;

  switch (type) {
    case 'auth:token': {
      if (payload && payload.token === AUTH_TOKEN) {
        clientState.authenticated = true;
        sendMessage(ws, {
          type: 'auth:success',
          payload: { clientId: clientState.id, expiresIn: 3600 },
        });
      } else {
        sendMessage(ws, {
          type: 'auth:failed',
          payload: { message: 'Invalid authentication token' },
        });
      }
      break;
    }

    case 'heartbeat:pong': {
      clearTimeout(clientState.heartbeatTimeout);
      clientState.heartbeatTimeout = null;
      break;
    }

    case 'subscribe': {
      if (payload && payload.channel) {
        clientState.subscriptions.add(payload.channel);
        sendMessage(ws, {
          type: 'subscribe:success',
          payload: { channel: payload.channel },
        });
      }
      break;
    }

    case 'unsubscribe': {
      if (payload && payload.channel) {
        clientState.subscriptions.delete(payload.channel);
        sendMessage(ws, {
          type: 'unsubscribe:success',
          payload: { channel: payload.channel },
        });
      }
      break;
    }

    case 'feed:send': {
      if (!clientState.authenticated) {
        sendMessage(ws, {
          type: 'error',
          payload: { message: 'Authentication required' },
        });
        return;
      }

      const feedMsg = {
        ...generateFeedMessage(),
        message: payload.message || 'User message',
        source: 'user',
      };

      // Broadcast to all authenticated feed subscribers
      clients.forEach((client) => {
        if (
          client.authenticated &&
          client.ws.readyState === client.ws.OPEN &&
          client.subscriptions.has('feed')
        ) {
          sendMessage(client.ws, { type: 'feed:message', payload: feedMsg });
        }
      });
      break;
    }

    default: {
      sendMessage(ws, {
        type: 'error',
        payload: { message: `Unknown message type: ${type}` },
      });
    }
  }
}

function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export { setupWebSocket };
