/**
 * ConnectionPool - Manages a pool of WebSocket connections with limits and reuse.
 */

import { WebSocketManager } from './WebSocketManager';

class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 5;
    this.connections = new Map();
    this.waitQueue = [];
    this.options = options;
  }

  async acquire(url, connectionOptions = {}) {
    // Check if a connection to this URL already exists
    const existing = this.connections.get(url);
    if (existing && existing.manager.getState().connected) {
      existing.refCount++;
      return existing.manager;
    }

    // Check pool capacity
    if (this.connections.size >= this.maxConnections) {
      // Try to find an idle connection to evict
      const evicted = this._evictIdle();
      if (!evicted) {
        // Wait for a connection to become available
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            const idx = this.waitQueue.findIndex((w) => w.resolve === resolve);
            if (idx !== -1) this.waitQueue.splice(idx, 1);
            reject(new Error('Connection pool exhausted: timeout waiting for available connection'));
          }, connectionOptions.acquireTimeout || 10000);

          this.waitQueue.push({ url, options: connectionOptions, resolve, reject, timeout });
        });
      }
    }

    // Create new connection
    const manager = new WebSocketManager(url, {
      ...this.options.defaultConnectionOptions,
      ...connectionOptions,
    });

    this.connections.set(url, {
      manager,
      refCount: 1,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      url,
    });

    manager.connect();

    return manager;
  }

  release(url) {
    const connection = this.connections.get(url);
    if (!connection) return;

    connection.refCount = Math.max(0, connection.refCount - 1);
    connection.lastUsedAt = Date.now();

    // If no references and wait queue has entries, reassign
    if (connection.refCount === 0 && this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      clearTimeout(waiter.timeout);

      // Evict the idle connection and create new one for waiter
      this._removeConnection(url);
      this.acquire(waiter.url, waiter.options).then(waiter.resolve).catch(waiter.reject);
    }
  }

  getConnection(url) {
    const connection = this.connections.get(url);
    if (connection) {
      connection.lastUsedAt = Date.now();
      return connection.manager;
    }
    return null;
  }

  getPoolStatus() {
    const status = {
      active: 0,
      idle: 0,
      total: this.connections.size,
      max: this.maxConnections,
      waiting: this.waitQueue.length,
      connections: [],
    };

    this.connections.forEach((conn, url) => {
      const state = conn.manager.getState();
      const info = {
        url,
        connected: state.connected,
        authenticated: state.authenticated,
        refCount: conn.refCount,
        age: Date.now() - conn.createdAt,
        idle: Date.now() - conn.lastUsedAt,
      };

      if (conn.refCount > 0) status.active++;
      else status.idle++;

      status.connections.push(info);
    });

    return status;
  }

  _evictIdle() {
    let oldestIdle = null;
    let oldestIdleUrl = null;

    this.connections.forEach((conn, url) => {
      if (conn.refCount === 0) {
        if (!oldestIdle || conn.lastUsedAt < oldestIdle.lastUsedAt) {
          oldestIdle = conn;
          oldestIdleUrl = url;
        }
      }
    });

    if (oldestIdleUrl) {
      this._removeConnection(oldestIdleUrl);
      return true;
    }

    return false;
  }

  _removeConnection(url) {
    const connection = this.connections.get(url);
    if (connection) {
      connection.manager.destroy();
      this.connections.delete(url);
    }
  }

  destroyAll() {
    // Clear wait queue
    this.waitQueue.forEach((waiter) => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Connection pool destroyed'));
    });
    this.waitQueue = [];

    // Destroy all connections
    this.connections.forEach((conn) => {
      conn.manager.destroy();
    });
    this.connections.clear();
  }
}

export { ConnectionPool };
