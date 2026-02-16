/**
 * Typed API endpoint definitions.
 */

const ENDPOINTS = {
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    CREATE: '/users',
  },
  ANALYTICS: '/analytics',
  DASHBOARD: '/dashboard',
  METRICS: '/metrics',
  ERROR: (code) => `/error?code=${code}`,
};

const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
};

export { ENDPOINTS, API_VERSIONS };
