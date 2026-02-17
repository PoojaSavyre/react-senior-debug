/**
 * FeedFilter - Filter controls for the live feed with debounced updates.
 */

import React, { memo, useCallback } from 'react';

const FeedFilter = memo(function FeedFilter({ filter, onChange }) {
  const handleTypeChange = useCallback(
    (e) => {
      onChange({ ...filter, type: e.target.value });
    },
    [filter, onChange]
  );

  const handleSeverityChange = useCallback(
    (e) => {
      onChange({ ...filter, severity: e.target.value });
    },
    [filter, onChange]
  );

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      padding: '10px',
      backgroundColor: 'white',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    }}>
      <div>
        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Type
        </label>
        <select value={filter.type} onChange={handleTypeChange} style={selectStyle}>
          <option value="all">All Types</option>
          <option value="alert">Alert</option>
          <option value="notification">Notification</option>
          <option value="update">Update</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Severity
        </label>
        <select value={filter.severity} onChange={handleSeverityChange} style={selectStyle}>
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
  );
});

const selectStyle = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '13px',
  backgroundColor: 'white',
  color: '#374151',
};

export { FeedFilter };
