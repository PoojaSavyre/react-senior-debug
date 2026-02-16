/**
 * UserActivity - Displays user activity timeline.
 *
 * Competency: React Suspense for Data Fetching
 * Bug surface: suspense not integrating with useEffect, stale data
 */

import React, { memo } from 'react';

const actionIcons = {
  login: '🔑',
  update: '✏️',
  deploy: '🚀',
  review: '👀',
  comment: '💬',
};

const UserActivity = memo(function UserActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No recent activity
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#111827' }}>
        Recent Activity
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '10px 0',
              borderBottom: index < activities.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}
          >
            <span style={{ fontSize: '16px' }}>
              {actionIcons[activity.action] || '📌'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#1f2937', textTransform: 'capitalize' }}>
                {activity.action}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {activity.details}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
              {new Date(activity.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export { UserActivity };
