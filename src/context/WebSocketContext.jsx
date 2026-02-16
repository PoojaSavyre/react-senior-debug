/**
 * WebSocketContext - Provides WebSocket state and methods to the component tree.
 *
 * Competency: WebSocket Real-time Communication, React Component Suspense Management
 * Bug surface: context not integrating with suspense, stale context values
 */

import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketContext = createContext(null);

function WebSocketProvider({ children, url, authToken }) {
  const [messages, setMessages] = useState([]);

  const handleMessage = useCallback((message) => {
    setMessages((prev) => {
      const updated = [...prev, message];
      // Keep only last 200 messages to prevent memory growth
      return updated.length > 200 ? updated.slice(-200) : updated;
    });
  }, []);

  const ws = useWebSocket(url, {
    authToken,
    autoConnect: true,
    onMessage: handleMessage,
  });

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = useMemo(
    () => ({
      ...ws,
      messages,
      clearMessages,
    }),
    [ws, messages, clearMessages]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

export { WebSocketProvider, useWebSocketContext, WebSocketContext };
