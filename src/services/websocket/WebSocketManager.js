/**
 * WebSocketManager - Full lifecycle management for WebSocket connections.
 * Handles connection, authentication, heartbeat, reconnection, message queuing,
 * serialization, and proper cleanup.
 *
 * Competency: WebSocket Real-time Communication
 */

const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      protocols: options.protocols || [],
      authToken: options.authToken || null,
      maxReconnectAttempts: options.maxReconnectAttempts || 10,
      baseReconnectDelay: options.baseReconnectDelay || 1000,
      maxReconnectDelay: options.maxReconnectDelay || 30000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      heartbeatTimeout: options.heartbeatTimeout || 5000,
      maxQueueSize: options.maxQueueSize || 100,
      enableBinary: options.enableBinary || false,
      onOpen: options.onOpen || null,
      onClose: options.onClose || null,
      onError: options.onError || null,
      onMessage: options.onMessage || null,
      onAuthSuccess: options.onAuthSuccess || null,
      onAuthFailed: options.onAuthFailed || null,
      onReconnecting: options.onReconnecting || null,
    };

    this.ws = null;
    this.state = WS_STATES.CLOSED;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.messageQueue = [];
    this.messageHandlers = new Map();
    this.pendingMessages = new Map();
    this.messageIdCounter = 0;
    this.isIntentionallyClosed = false;
    this.authenticated = false;
    this.connectionId = null;
    this.lastHeartbeatAt = null;
    this.heartbeatMissCount = 0;
    this.messageSequence = 0;
    this.outOfOrderCount = 0;
    this.lastReceivedSequence = -1;
  }

  connect() {
    if (this.ws && (this.state === WS_STATES.CONNECTING || this.state === WS_STATES.OPEN)) {
      console.warn('[WSManager] Already connected or connecting');
      return;
    }

    this.isIntentionallyClosed = false;
    this.state = WS_STATES.CONNECTING;

    try {
      this.ws = new WebSocket(this.url, this.options.protocols);

      if (this.options.enableBinary) {
        this.ws.binaryType = 'arraybuffer';
      }

      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
    } catch (err) {
      console.error('[WSManager] Connection error:', err);
      this._scheduleReconnect();
    }
  }

  disconnect(code = 1000, reason = 'Client disconnect') {
    this.isIntentionallyClosed = true;
    this._clearTimers();

    if (this.ws) {
      this.state = WS_STATES.CLOSING;
      this.ws.close(code, reason);
    }

    this.authenticated = false;
    this.connectionId = null;
    this.state = WS_STATES.CLOSED;
  }

  send(type, payload = {}) {
    const message = {
      id: `msg-${++this.messageIdCounter}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.ws && this.ws.readyState === WS_STATES.OPEN) {
      this._sendRaw(message);
    } else {
      this._enqueueMessage(message);
    }

    return message.id;
  }

  sendBinary(data) {
    if (!this.options.enableBinary) {
      console.warn('[WSManager] Binary mode not enabled');
      return;
    }

    if (this.ws && this.ws.readyState === WS_STATES.OPEN) {
      const buffer = data instanceof ArrayBuffer ? data : new TextEncoder().encode(JSON.stringify(data)).buffer;
      this.ws.send(buffer);
    }
  }

  subscribe(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  getState() {
    return {
      connected: this.state === WS_STATES.OPEN,
      authenticated: this.authenticated,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      state: this.state,
      lastHeartbeatAt: this.lastHeartbeatAt,
      heartbeatMissCount: this.heartbeatMissCount,
      messageSequence: this.messageSequence,
      outOfOrderCount: this.outOfOrderCount,
    };
  }

  // Private methods

  _handleOpen() {
    console.log('[WSManager] Connected');
    this.state = WS_STATES.OPEN;
    this.reconnectAttempts = 0;

    this._flushQueue();
    this._startHeartbeatMonitor();

    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }

  _handleClose(event) {
    console.log(`[WSManager] Closed (code: ${event.code}, reason: ${event.reason})`);
    this.state = WS_STATES.CLOSED;
    this.authenticated = false;
    this._clearTimers();

    if (this.options.onClose) {
      this.options.onClose(event);
    }

    if (!this.isIntentionallyClosed) {
      this._scheduleReconnect();
    }
  }

  _handleError(error) {
    console.error('[WSManager] Error:', error);

    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  _handleMessage(event) {
    let message;

    if (event.data instanceof ArrayBuffer) {
      const text = new TextDecoder().decode(event.data);
      try {
        message = JSON.parse(text);
      } catch {
        this._notifyHandlers('binary', event.data);
        return;
      }
    } else {
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        console.error('[WSManager] Failed to parse message:', err);
        return;
      }
    }

    // Handle internal message types
    switch (message.type) {
      case 'connection:established':
        this.connectionId = message.payload?.clientId;
        if (this.options.authToken) {
          this.send('auth:token', { token: this.options.authToken });
        }
        break;

      case 'auth:required':
        if (this.options.authToken) {
          this.send('auth:token', { token: this.options.authToken });
        }
        break;

      case 'auth:success':
        this.authenticated = true;
        if (this.options.onAuthSuccess) {
          this.options.onAuthSuccess(message.payload);
        }
        break;

      case 'auth:failed':
        this.authenticated = false;
        if (this.options.onAuthFailed) {
          this.options.onAuthFailed(message.payload);
        }
        break;

      case 'heartbeat:ping':
        this.send('heartbeat:pong', { timestamp: Date.now() });
        this._resetHeartbeatTimeout();
        this.lastHeartbeatAt = Date.now();
        break;

      default:
        break;
    }

    // Notify type-specific handlers
    this._notifyHandlers(message.type, message.payload);

    // Notify global message handler
    if (this.options.onMessage) {
      this.options.onMessage(message);
    }
  }

  _notifyHandlers(type, payload) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[WSManager] Handler error for ${type}:`, err);
        }
      });
    }
  }

  _sendRaw(message) {
    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.error('[WSManager] Send error:', err);
      this._enqueueMessage(message);
    }
  }

  _enqueueMessage(message) {
    if (this.messageQueue.length >= this.options.maxQueueSize) {
      console.warn('[WSManager] Message queue overflow, dropping oldest message');
      this.messageQueue.shift();
    }
    this.messageQueue.push(message);
  }

  _flushQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WS_STATES.OPEN) {
      const message = this.messageQueue.shift();
      this._sendRaw(message);
    }
  }

  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WSManager] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const delay = Math.min(
      this.options.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1) +
        Math.random() * 1000,
      this.options.maxReconnectDelay
    );

    console.log(
      `[WSManager] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`
    );

    if (this.options.onReconnecting) {
      this.options.onReconnecting(this.reconnectAttempts, delay);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Heartbeat monitor - detects if server stops sending pings.
   * Bug surface: heartbeat timeout, missed heartbeats, stale connection detection
   */
  _startHeartbeatMonitor() {
    this._clearHeartbeatTimeout();
    this.heartbeatMissCount = 0;
    this.lastHeartbeatAt = Date.now();

    // Check periodically if heartbeat has been received
    this.heartbeatTimer = setInterval(() => {
      if (!this.lastHeartbeatAt) return;

      const elapsed = Date.now() - this.lastHeartbeatAt;
      if (elapsed > this.options.heartbeatInterval + this.options.heartbeatTimeout) {
        this.heartbeatMissCount++;
        console.warn(`[WSManager] Heartbeat missed (${this.heartbeatMissCount} total)`);
        this._notifyHandlers('heartbeat:missed', {
          missCount: this.heartbeatMissCount,
          lastHeartbeatAt: this.lastHeartbeatAt,
          elapsed,
        });

        // After 3 missed heartbeats, consider connection dead
        if (this.heartbeatMissCount >= 3) {
          console.error('[WSManager] Connection appears dead (3 missed heartbeats)');
          this._notifyHandlers('heartbeat:dead', {
            missCount: this.heartbeatMissCount,
          });
          this.ws?.close(4000, 'Heartbeat timeout');
        }
      }
    }, this.options.heartbeatInterval);
  }

  _resetHeartbeatTimeout() {
    this.heartbeatMissCount = 0;
  }

  _clearHeartbeatTimeout() {
    clearTimeout(this.heartbeatTimeoutTimer);
    this.heartbeatTimeoutTimer = null;
  }

  /**
   * Track message sequence to detect out-of-order delivery.
   * Bug surface: message ordering, lost messages, duplicate detection
   */
  trackMessageSequence(sequenceNum) {
    this.messageSequence++;
    if (sequenceNum !== undefined && sequenceNum <= this.lastReceivedSequence) {
      this.outOfOrderCount++;
    }
    if (sequenceNum !== undefined) {
      this.lastReceivedSequence = sequenceNum;
    }
  }

  _clearTimers() {
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.heartbeatTimeoutTimer);
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
  }

  destroy() {
    this.disconnect();
    this.messageHandlers.clear();
    this.messageQueue = [];
    this.pendingMessages.clear();
  }
}

export { WebSocketManager, WS_STATES };
