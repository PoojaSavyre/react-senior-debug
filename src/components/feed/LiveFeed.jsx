/**
 * LiveFeed - Real-time WebSocket feed consumer with message ordering and stats.
 *
 * Competency: WebSocket Real-time Communication, React Hook Dependencies
 * Bug surface: message ordering, duplicate handling, connection state race condition,
 *              message queue overflow, memory leaks, heartbeat monitoring,
 *              reconnection handling, stale closure in event handlers
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useWebSocketContext } from '../../context/WebSocketContext';
import { FeedItem } from './FeedItem';
import { FeedFilter } from './FeedFilter';
import { MessageComposer } from './MessageComposer';

const MAX_FEED_ITEMS = 100;

const LiveFeed = memo(function LiveFeed() {
  const { subscribe, send, connected, authenticated, reconnecting, reconnectAttempt, getState } = useWebSocketContext();
  const [feedItems, setFeedItems] = useState([]);
  const [filter, setFilter] = useState({ type: 'all', severity: 'all' });
  const seenIdsRef = useRef(new Set());
  const feedContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [wsStats, setWsStats] = useState(null);
  const [messageSequence, setMessageSequence] = useState(0);
  const [outOfOrderCount, setOutOfOrderCount] = useState(0);
  const lastSequenceRef = useRef(-1);

  // Subscribe to feed messages with sequence tracking
  useEffect(() => {
    const unsubscribe = subscribe('feed:message', (payload) => {
      // Deduplicate messages
      if (seenIdsRef.current.has(payload.id)) {
        return;
      }
      seenIdsRef.current.add(payload.id);

      // Track message ordering via sequence numbers
      setMessageSequence((prev) => {
        const newSeq = prev + 1;
        if (payload.sequence !== undefined && payload.sequence <= lastSequenceRef.current) {
          setOutOfOrderCount((c) => c + 1);
        }
        if (payload.sequence !== undefined) {
          lastSequenceRef.current = payload.sequence;
        }
        return newSeq;
      });

      // Limit seen IDs set size
      if (seenIdsRef.current.size > MAX_FEED_ITEMS * 2) {
        const idsArray = Array.from(seenIdsRef.current);
        seenIdsRef.current = new Set(idsArray.slice(-MAX_FEED_ITEMS));
      }

      setFeedItems((prev) => {
        const updated = [...prev, { ...payload, receivedAt: Date.now() }];
        return updated.length > MAX_FEED_ITEMS ? updated.slice(-MAX_FEED_ITEMS) : updated;
      });
    });

    return unsubscribe;
  }, [subscribe]);

  // Subscribe to heartbeat events
  useEffect(() => {
    const unsubMissed = subscribe('heartbeat:missed', (payload) => {
      console.warn('[LiveFeed] Heartbeat missed:', payload);
    });

    const unsubDead = subscribe('heartbeat:dead', () => {
      console.error('[LiveFeed] Connection dead - heartbeat timeout');
    });

    return () => {
      unsubMissed();
      unsubDead();
    };
  }, [subscribe]);

  // Poll WebSocket stats for display
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getState();
      if (state) {
        setWsStats(state);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [getState]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && feedContainerRef.current) {
      feedContainerRef.current.scrollTop = feedContainerRef.current.scrollHeight;
    }
  }, [feedItems.length, autoScroll]);

  // Detect manual scroll to pause auto-scroll
  const handleScroll = useCallback(() => {
    const el = feedContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  const clearFeed = useCallback(() => {
    setFeedItems([]);
    seenIdsRef.current.clear();
    setMessageSequence(0);
    setOutOfOrderCount(0);
    lastSequenceRef.current = -1;
  }, []);

  // Apply filters
  const filteredItems = feedItems.filter((item) => {
    if (filter.type !== 'all' && item.type !== filter.type) return false;
    if (filter.severity !== 'all' && item.severity !== filter.severity) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Live Feed</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {filteredItems.length} messages
          </span>
          <button onClick={clearFeed} style={clearBtnStyle}>
            Clear
          </button>
        </div>
      </div>

      {/* Connection Stats Panel */}
      <ConnectionStatsPanel
        connected={connected}
        authenticated={authenticated}
        reconnecting={reconnecting}
        reconnectAttempt={reconnectAttempt}
        wsStats={wsStats}
        messageSequence={messageSequence}
        outOfOrderCount={outOfOrderCount}
      />

      <FeedFilter filter={filter} onChange={handleFilterChange} />

      {!connected && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#92400e',
        }}>
          {reconnecting
            ? `Reconnecting... (attempt ${reconnectAttempt})`
            : 'WebSocket disconnected. Messages will resume when connection is restored.'}
        </div>
      )}

      <div
        ref={feedContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
        }}
      >
        {filteredItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            {connected && authenticated
              ? 'Waiting for messages...'
              : 'Connect to see live messages'}
          </div>
        ) : (
          filteredItems.map((item) => (
            <FeedItem key={item.id} item={item} />
          ))
        )}
      </div>

      {!autoScroll && (
        <button
          onClick={() => setAutoScroll(true)}
          style={{
            position: 'relative',
            bottom: '50px',
            alignSelf: 'center',
            padding: '6px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
          }}
        >
          Scroll to latest
        </button>
      )}

      <MessageComposer />
    </div>
  );
});

/**
 * Connection stats panel - displays WebSocket health metrics.
 * Bug surface: stale state, missing updates, heartbeat display
 */
const ConnectionStatsPanel = memo(function ConnectionStatsPanel({
  connected,
  authenticated,
  reconnecting,
  reconnectAttempt,
  wsStats,
  messageSequence,
  outOfOrderCount,
}) {
  const heartbeatAge = wsStats?.lastHeartbeatAt
    ? Math.round((Date.now() - wsStats.lastHeartbeatAt) / 1000)
    : null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: '8px',
      marginBottom: '12px',
    }}>
      <StatBadge
        label="Connection"
        value={connected ? 'Connected' : reconnecting ? 'Reconnecting' : 'Disconnected'}
        color={connected ? '#059669' : reconnecting ? '#d97706' : '#dc2626'}
      />
      <StatBadge
        label="Auth"
        value={authenticated ? 'Authenticated' : 'Not Auth'}
        color={authenticated ? '#059669' : '#6b7280'}
      />
      <StatBadge
        label="Messages"
        value={messageSequence}
        color="#3b82f6"
      />
      <StatBadge
        label="Out of Order"
        value={outOfOrderCount}
        color={outOfOrderCount > 0 ? '#dc2626' : '#059669'}
      />
      <StatBadge
        label="Queued"
        value={wsStats?.queuedMessages ?? 0}
        color="#6b7280"
      />
      <StatBadge
        label="Heartbeat"
        value={heartbeatAge !== null ? `${heartbeatAge}s ago` : 'N/A'}
        color={heartbeatAge !== null && heartbeatAge > 60 ? '#dc2626' : '#059669'}
      />
      <StatBadge
        label="HB Misses"
        value={wsStats?.heartbeatMissCount ?? 0}
        color={wsStats?.heartbeatMissCount > 0 ? '#f59e0b' : '#059669'}
      />
      {reconnecting && (
        <StatBadge
          label="Reconnect #"
          value={reconnectAttempt}
          color="#d97706"
        />
      )}
    </div>
  );
});

const StatBadge = memo(function StatBadge({ label, value, color }) {
  return (
    <div style={{
      padding: '8px 10px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color }}>{String(value)}</div>
    </div>
  );
});

const clearBtnStyle = {
  padding: '6px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#374151',
};

export { LiveFeed };
