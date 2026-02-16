import { Router } from 'express';
import {
  generateUsers,
  generateUser,
  generateAnalytics,
  generateDashboardWidgets,
  generatePerformanceMetrics,
} from './mockData.js';

const router = Router();

const users = generateUsers(50);

const requestCounts = new Map();
const RATE_LIMIT = 200;
const RATE_WINDOW = 60000;

function rateLimiter(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;

  if (!requestCounts.has(key)) {
    requestCounts.set(key, []);
  }

  const timestamps = requestCounts.get(key).filter((t) => t > windowStart);
  timestamps.push(now);
  requestCounts.set(key, timestamps);

  res.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - timestamps.length)));
  res.set('X-RateLimit-Reset', String(Math.ceil((windowStart + RATE_WINDOW) / 1000)));

  if (timestamps.length > RATE_LIMIT) {
    const retryAfter = Math.ceil(RATE_WINDOW / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit of ${RATE_LIMIT} requests per minute exceeded`,
      retryAfter,
    });
  }

  next();
}

router.use(rateLimiter);

// GET /api/v1/users - paginated user list
router.get('/v1/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const delay = parseInt(req.query.delay) || 300;

  setTimeout(() => {
    let filtered = users;
    if (search) {
      filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    res.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
        hasNext: end < filtered.length,
        hasPrev: page > 1,
      },
    });
  }, delay);
});

// GET /api/v1/users/:id - single user
router.get('/v1/users/:id', (req, res) => {
  const delay = parseInt(req.query.delay) || 200;
  const id = parseInt(req.params.id);

  setTimeout(() => {
    const user = users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      data: {
        ...user,
        activity: Array.from({ length: 10 }, (_, i) => ({
          id: `act-${id}-${i}`,
          action: ['login', 'update', 'deploy', 'review', 'comment'][i % 5],
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          details: `Activity details for item ${i + 1}`,
        })),
      },
    });
  }, delay);
});

// POST /api/v1/users - create user
router.post('/v1/users', (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newUser = generateUser(users.length + 1);
  newUser.name = name;
  newUser.email = email;
  if (role) newUser.role = role;

  users.push(newUser);

  res.status(201).json({ data: newUser });
});

// GET /api/v1/analytics - analytics data (intentionally slow)
router.get('/v1/analytics', (req, res) => {
  const delay = parseInt(req.query.delay) || 2000;

  setTimeout(() => {
    res.json({ data: generateAnalytics() });
  }, delay);
});

// GET /api/v1/dashboard - dashboard widgets
router.get('/v1/dashboard', (req, res) => {
  const delay = parseInt(req.query.delay) || 500;

  setTimeout(() => {
    res.json({
      data: {
        widgets: generateDashboardWidgets(),
        lastUpdated: new Date().toISOString(),
      },
    });
  }, delay);
});

// GET /api/v1/metrics - performance metrics
router.get('/v1/metrics', (req, res) => {
  const delay = parseInt(req.query.delay) || 100;

  setTimeout(() => {
    res.json({ data: generatePerformanceMetrics() });
  }, delay);
});

// GET /api/v2/users - v2 endpoint (different shape for versioning tests)
router.get('/v2/users', (req, res) => {
  const delay = parseInt(req.query.delay) || 300;

  setTimeout(() => {
    const v2Users = users.slice(0, 10).map((u) => ({
      userId: u.id,
      fullName: u.name,
      contactEmail: u.email,
      department: u.role,
      isOnline: u.status === 'active',
      performance: u.metrics,
    }));

    res.json({ users: v2Users, version: 'v2', count: v2Users.length });
  }, delay);
});

// Simulated error endpoint
router.get('/v1/error', (req, res) => {
  const code = parseInt(req.query.code) || 500;
  res.status(code).json({
    error: `Simulated ${code} error`,
    message: 'This endpoint is for testing error handling',
  });
});

export default router;
