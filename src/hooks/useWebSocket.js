/**
 * useWebSocket - React hook for WebSocket connection management.
 *
 * Competency: React Hook Dependencies, WebSocket Real-time Communication
 * Bug surface: stale closures, missing cleanup, dependency referential inequality,
 *              effect timing, memory leaks, closure capturing stale state
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WebSocketManager } from '../services/websocket/WebSocketManager';

const EMPTY_PROTOCOLS = [];

function useWebSocket(url, options = {}) {
  const {
    authToken = null,
    autoConnect = true,
    onMessage = null,
    onOpen = null,
    onClose = null,
    onError = null,
    protocols = EMPTY_PROTOCOLS,
    reconnectAttempts = 10,
  } = options;

  const [connectionState, setConnectionState] = useState({
    connected: false,
    authenticated: false,
    reconnecting: false,
    reconnectAttempt: 0,
    error: null,
  });

  const [lastMessage, setLastMessage] = useState(null);

  // Use refs for callbacks to prevent stale closures
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Keep refs in sync without causing re-effects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Stable reference for manager
  const managerRef = useRef(null);

  // Memoize the config to avoid dependency changes
  const wsConfig = useMemo(
    () => ({
      authToken,
      protocols,
      maxReconnectAttempts: reconnectAttempts,
      onOpen: () => {
        setConnectionState((prev) => ({
          ...prev,
          connected: true,
          reconnecting: false,
          reconnectAttempt: 0,
          error: null,
        }));
        if (onOpenRef.current) onOpenRef.current();
      },
      onClose: (event) => {
        setConnectionState((prev) => ({
          ...prev,
          connected: false,
          authenticated: false,
        }));
        if (onCloseRef.current) onCloseRef.current(event);
      },
      onError: (error) => {
        setConnectionState((prev) => ({ ...prev, error }));
        if (onErrorRef.current) onErrorRef.current(error);
      },
      onMessage: (message) => {
        setLastMessage(message);
        if (onMessageRef.current) onMessageRef.current(message);
      },
      onAuthSuccess: () => {
        setConnectionState((prev) => ({ ...prev, authenticated: true }));
      },
      onAuthFailed: () => {
        setConnectionState((prev) => ({
          ...prev,
          authenticated: false,
          error: new Error('Authentication failed'),
        }));
      },
      onReconnecting: (attempt) => {
        setConnectionState((prev) => ({
          ...prev,
          reconnecting: true,
          reconnectAttempt: attempt,
        }));
      },
    }),
    [authToken, protocols, reconnectAttempts]
  );

  // Create and manage WebSocket connection
  useEffect(() => {
    if (!url) return;

    const manager = new WebSocketManager(url, wsConfig);
    managerRef.current = manager;

    if (autoConnect) {
      manager.connect();
    }

    // Cleanup on unmount or URL change
    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [url, wsConfig, autoConnect]);

  // Stable send function
  const send = useCallback((type, payload) => {
    if (managerRef.current) {
      return managerRef.current.send(type, payload);
    }
    console.warn('[useWebSocket] Cannot send: not connected');
    return null;
  }, []);

  // Stable subscribe function
  const subscribe = useCallback((messageType, handler) => {
    if (managerRef.current) {
      return managerRef.current.subscribe(messageType, handler);
    }
    return () => {};
  }, []);

  // Stable connect/disconnect
  const connect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.disconnect();
    }
  }, []);

  const getState = useCallback(() => {
    if (managerRef.current) {
      return managerRef.current.getState();
    }
    return null;
  }, []);

  return {
    ...connectionState,
    lastMessage,
    send,
    subscribe,
    connect,
    disconnect,
    getState,
  };
}

export { useWebSocket };
