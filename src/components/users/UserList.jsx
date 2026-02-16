/**
 * UserList - Fetches and displays user list using Suspense resources.
 *
 * Competency: React Suspense for Data Fetching, React Component Suspense Management
 * Bug surface: incorrect data fetching in suspense, suspense not updating on data change,
 *              stale data in suspense fallback, suspense with incorrect loading state
 */

import React, { useState, useCallback, startTransition, memo } from 'react';
import { SuspenseBoundary } from '../common/SuspenseBoundary';
import { SkeletonList } from '../common/SuspenseFallback';
import { UserProfile } from './UserProfile';
import { get } from '../../api/client';

// ── Module-level Suspense cache for user list (keyed by page+search) ──
// Uses apiClient (retry, dedup, rate limiting) inside the throw-promise pattern
const userListCache = new Map();

function readUserList(page, search) {
  const key = `${page}-${search}`;
  if (userListCache.has(key)) {
    const entry = userListCache.get(key);
    if (entry.data) return entry.data;
    throw entry.promise;
  }
  const entry = { data: null, promise: null };
  entry.promise = get(`/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`)
    .then((d) => { entry.data = d; })
    .catch((e) => { userListCache.delete(key); throw e; });
  userListCache.set(key, entry);
  throw entry.promise;
}

function UserListContent({ page, search, onSelectUser }) {
  const data = readUserList(page, search);
  const users = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.map((user) => (
          <UserRow key={user.id} user={user} onSelect={onSelectUser} />
        ))}
        {users.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No users found
          </div>
        )}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px 0',
        fontSize: '13px',
      }}>
        <span style={{ color: '#6b7280' }}>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
        </span>
      </div>
    </div>
  );
}

const UserRow = memo(function UserRow({ user, onSelect }) {
  return (
    <div
      onClick={() => onSelect(user.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600',
        color: '#6b7280',
      }}>
        {user.name.charAt(0)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{user.name}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
      </div>
      <span style={{
        padding: '3px 10px',
        borderRadius: '12px',
        backgroundColor: '#f3f4f6',
        fontSize: '12px',
        color: '#4b5563',
      }}>
        {user.role}
      </span>
    </div>
  );
});

const UserList = memo(function UserList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleSearch = useCallback(() => {
    startTransition(() => {
      setSearch(searchInput);
      setPage(1);
    });
  }, [searchInput]);

  const handleSelectUser = useCallback((userId) => {
    setSelectedUserId(userId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    startTransition(() => {
      setPage(newPage);
    });
  }, []);

  if (selectedUserId) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={handleBack} style={{
          padding: '6px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#374151',
        }}>
          ← Back to list
        </button>
        {/* Nested Suspense boundary for user profile */}
        <SuspenseBoundary
          suspenseKey={selectedUserId}
          level="section"
        >
          <UserProfile userId={selectedUserId} />
        </SuspenseBoundary>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', color: '#111827' }}>Users</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search users..."
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <button onClick={handleSearch} style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}>
          Search
        </button>
      </div>

      <SuspenseBoundary
        suspenseKey={`${page}-${search}`}
        fallback={<SkeletonList count={10} />}
        level="section"
      >
        <UserListContent
          page={page}
          search={search}
          onSelectUser={handleSelectUser}
        />
      </SuspenseBoundary>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={pageBtnStyle}
        >
          Previous
        </button>
        <button onClick={() => handlePageChange(page + 1)} style={pageBtnStyle}>
          Next
        </button>
      </div>
    </div>
  );
});

const pageBtnStyle = {
  padding: '6px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
};

export { UserList };
