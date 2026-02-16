/**
 * API Client - Handles fetch requests with rate limiting, retry, error handling,
 * request deduplication, and abort controller integration.
 *
 * Competency: API Response Caching
 * Bug surface: rate limits, race conditions, error handling, API versioning
 */

const DEFAULT_BASE_URL = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

// In-flight request deduplication
const inFlightRequests = new Map();

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class RateLimitError extends ApiError {
  constructor(retryAfter, data) {
    super(`Rate limited. Retry after ${retryAfter}s`, 429, data);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

async function apiClient(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    baseUrl = DEFAULT_BASE_URL,
    retry = true,
    maxRetries = MAX_RETRIES,
    deduplicate = true,
    signal = null,
    version = 'v1',
  } = options;

  const url = `${baseUrl}/${version}${endpoint}`;

  // Request deduplication for GET requests WITHOUT abort signals.
  // Requests with signals are independently cancellable and must not
  // be shared — otherwise an abort from one consumer kills every consumer.
  const canDedup = method === 'GET' && deduplicate && !signal;

  if (canDedup) {
    const existing = inFlightRequests.get(url);
    if (existing) {
      return existing;
    }
  }

  const fetchPromise = _executeFetch(url, {
    method,
    body,
    headers,
    signal,
    retry,
    maxRetries,
    attempt: 0,
  });

  // Track in-flight GET requests for deduplication
  if (canDedup) {
    inFlightRequests.set(url, fetchPromise);
    fetchPromise.then(
      () => inFlightRequests.delete(url),
      () => inFlightRequests.delete(url)
    );
  }

  return fetchPromise;
}

async function _executeFetch(url, options) {
  const { method, body, headers, signal, retry, maxRetries, attempt } = options;

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Only attach signal when it's a real AbortSignal (not null/undefined)
  if (signal) {
    fetchOptions.signal = signal;
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      const data = await response.json().catch(() => null);

      if (retry && attempt < maxRetries) {
        // Wait the shorter of retryAfter or 5 seconds
        await _delay(Math.min(retryAfter, 5) * 1000);
        return _executeFetch(url, { ...options, attempt: attempt + 1 });
      }

      throw new RateLimitError(retryAfter, data);
    }

    // Handle server errors with retry
    if (response.status >= 500 && retry && attempt < maxRetries) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
      await _delay(delay);
      return _executeFetch(url, { ...options, attempt: attempt + 1 });
    }

    // Handle client errors
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(
        data?.error || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Don't retry aborted requests
    if (error.name === 'AbortError') {
      throw error;
    }

    // Don't retry known API errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Retry network errors
    if (retry && attempt < maxRetries) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
      await _delay(delay);
      return _executeFetch(url, { ...options, attempt: attempt + 1 });
    }

    throw new ApiError(error.message, 0, null);
  }
}

function _delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convenience methods
function get(endpoint, options = {}) {
  return apiClient(endpoint, { ...options, method: 'GET' });
}

function post(endpoint, body, options = {}) {
  return apiClient(endpoint, { ...options, method: 'POST', body });
}

function put(endpoint, body, options = {}) {
  return apiClient(endpoint, { ...options, method: 'PUT', body });
}

function del(endpoint, options = {}) {
  return apiClient(endpoint, { ...options, method: 'DELETE' });
}

export { apiClient, get, post, put, del, ApiError, RateLimitError };
