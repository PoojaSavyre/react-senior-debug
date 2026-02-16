/**
 * RealTimeIndicator - Shows WebSocket connection status.
 *
 * Competency: WebSocket Real-time Communication
 */

import React, { memo } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';

const RealTimeIndicator = memo(function RealTimeIndicator() {
  const { connected, authenticated, reconnecting, reconnectAttempt } = useWebSocketContext();

  let status = 'disconnected';
  let color = '#ef4444';
  let label = 'Disconnected';

  if (reconnecting) {
    status = 'reconnecting';
    color = '#f59e0b';
    label = `Reconnecting (${reconnectAttempt})...`;
  } else if (connected && authenticated) {
    status = 'connected';
    color = '#10b981';
    label = 'Live';
  } else if (connected) {
    status = 'authenticating';
    color = '#f59e0b';
    label = 'Authenticating...';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
      }}
      role="status"
      aria-label={`Connection status: ${label}`}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          animation: status === 'reconnecting' ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ fontSize: '12px', color, fontWeight: '500' }}>{label}</span>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
});

export { RealTimeIndicator };
