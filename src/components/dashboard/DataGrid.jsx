/**
 * DataGrid - Large dataset rendering with virtualization-like pattern.
 *
 * Competency: React Performance Analysis, Event Loop Optimization, API Response Caching
 * Bug surface: blocking event loop, stale props, incorrect React.memo,
 *              cache strategies, race conditions
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import { useApiCache } from '../../hooks/useApiCache';
import { get } from '../../api/client';

const VISIBLE_ROWS = 20;

const DataGrid = memo(function DataGrid({ filter = '' }) {
  const [page, setPage] = useState(1);

  // Fetch with cache-first strategy via useApiCache
  const { data, isLoading } = useApiCache(
    () => get(`/users?page=${page}&limit=50`),
    { cacheKey: `datagrid-users-${page}`, strategy: 'cache-first', ttl: 30000 }
  );

  const users = useMemo(() => {
    if (!data?.data) return [];
    if (!filter) return data.data;
    const lowerFilter = filter.toLowerCase();
    return data.data.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerFilter) ||
        u.email.toLowerCase().includes(lowerFilter) ||
        u.role.toLowerCase().includes(lowerFilter)
    );
  }, [data, filter]);

  const visibleUsers = useMemo(() => {
    return users.slice(0, VISIBLE_ROWS);
  }, [users]);

  const handleNextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  if (isLoading && !data) {
    return <div style={{ padding: '20px', color: '#6b7280' }}>Loading grid data...</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Tasks</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map((user) => (
            <DataGridRow key={user.id} user={user} />
          ))}
          {visibleUsers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                {filter ? 'No matching results' : 'No data available'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          Showing {visibleUsers.length} of {users.length} rows (page {page})
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrevPage} disabled={page === 1} style={btnStyle}>
            Previous
          </button>
          <button onClick={handleNextPage} style={btnStyle}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
});

const DataGridRow = memo(function DataGridRow({ user }) {
  const statusColor = {
    active: '#059669',
    inactive: '#6b7280',
    away: '#d97706',
    busy: '#dc2626',
  };

  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
      <td style={tdStyle}>{user.name}</td>
      <td style={tdStyle}>{user.email}</td>
      <td style={tdStyle}>
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: '#f3f4f6',
          fontSize: '12px',
        }}>
          {user.role}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          color: statusColor[user.status] || '#6b7280',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusColor[user.status] || '#6b7280',
          }} />
          {user.status}
        </span>
      </td>
      <td style={tdStyle}>{user.metrics?.tasksCompleted || 0}</td>
    </tr>
  );
});

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
};

const tdStyle = {
  padding: '10px 16px',
  color: '#4b5563',
};

const btnStyle = {
  padding: '6px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#374151',
};

export { DataGrid };
