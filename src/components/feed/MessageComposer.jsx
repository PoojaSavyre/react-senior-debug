/**
 * MessageComposer - Send messages via WebSocket.
 *
 * Competency: WebSocket Real-time Communication
 * Bug surface: connection state race condition, serialization errors
 */

import React, { useState, useCallback, memo } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';

const MessageComposer = memo(function MessageComposer() {
  const { send, connected, authenticated } = useWebSocketContext();
  const [message, setMessage] = useState('');

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    send('feed:send', { message: message.trim() });
    setMessage('');
  }, [message, send]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = connected && authenticated && message.trim();

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    }}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={connected ? 'Type a message...' : 'Connect to send messages'}
        disabled={!connected || !authenticated}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        style={{
          padding: '8px 20px',
          backgroundColor: canSend ? '#3b82f6' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: canSend ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          fontWeight: '500',
        }}
      >
        Send
      </button>
    </div>
  );
});

export { MessageComposer };
