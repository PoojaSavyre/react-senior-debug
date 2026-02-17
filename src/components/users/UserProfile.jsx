/**
 * UserProfile - Nested Suspense boundaries for user detail + activity data.
 */

import React from 'react';
import { SuspenseBoundary } from '../common/SuspenseBoundary';
import { SkeletonCard } from '../common/SuspenseFallback';
import { UserActivity } from './UserActivity';
import { get } from '../../api/client';

// ── Module-level Suspense cache for user profiles ──
// Uses apiClient (retry, dedup, rate limiting)
const userProfileCache = new Map();

function readUserProfile(userId) {
  const key = String(userId);
  if (userProfileCache.has(key)) {
    const entry = userProfileCache.get(key);
    if (entry.data) return entry.data;
    if (entry.error) throw entry.error; // ErrorBoundary catches once
    throw entry.promise;
  }
  const entry = { data: null, error: null, promise: null };
  entry.promise = get(`/users/${userId}`)
    .then((d) => { entry.data = d; })
    .catch((e) => { entry.error = e; }); // Store error, don't delete cache entry
  userProfileCache.set(key, entry);
  throw entry.promise;
}

function UserProfile({ userId }) {
  const response = readUserProfile(userId);
  const user = response.data;

  return (
    <div>
      {/* User info section */}
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '600',
            color: '#6b7280',
          }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>{user.name}</h3>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
              }}>
                {user.role}
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: user.status === 'active' ? '#f0fdf4' : '#f9fafb',
                color: user.status === 'active' ? '#166534' : '#6b7280',
                fontSize: '12px',
              }}>
                {user.status}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <StatCard label="Tasks Completed" value={user.metrics?.tasksCompleted || 0} />
          <StatCard label="Avg Response" value={`${user.metrics?.avgResponseTime || 0}ms`} />
          <StatCard label="Satisfaction" value={`${user.metrics?.satisfactionScore || 0}/5`} />
        </div>
      </div>

      {/* Activity section - nested Suspense boundary */}
      <SuspenseBoundary
        suspenseKey={`activity-${userId}`}
        fallback={<SkeletonCard height="200px" />}
        level="section"
      >
        <UserActivity activities={user.activity || []} />
      </SuspenseBoundary>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

export { UserProfile };
