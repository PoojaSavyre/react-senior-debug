const firstNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank',
  'Ivy', 'Jack', 'Karen', 'Leo', 'Mona', 'Nick', 'Olivia', 'Paul',
  'Quinn', 'Rita', 'Sam', 'Tina', 'Uma', 'Vince', 'Wendy', 'Xavier',
];

const lastNames = [
  'Anderson', 'Baker', 'Clark', 'Davis', 'Evans', 'Foster', 'Garcia',
  'Harris', 'Irwin', 'Jones', 'King', 'Lopez', 'Miller', 'Nelson',
  'Owen', 'Patel', 'Quinn', 'Rivera', 'Smith', 'Taylor',
];

const roles = ['Admin', 'Developer', 'Designer', 'Manager', 'Analyst', 'DevOps'];
const statuses = ['active', 'inactive', 'away', 'busy'];
const feedTypes = ['alert', 'notification', 'update', 'warning', 'info'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUser(id) {
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  return {
    id,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    role: randomItem(roles),
    status: randomItem(statuses),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    joinedAt: new Date(Date.now() - randomInt(1, 365) * 86400000).toISOString(),
    lastActive: new Date(Date.now() - randomInt(0, 48) * 3600000).toISOString(),
    metrics: {
      tasksCompleted: randomInt(10, 500),
      avgResponseTime: randomInt(100, 2000),
      satisfactionScore: (Math.random() * 2 + 3).toFixed(1),
    },
  };
}

function generateUsers(count = 50) {
  return Array.from({ length: count }, (_, i) => generateUser(i + 1));
}

function generateAnalytics() {
  const now = Date.now();
  const dataPoints = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
    activeUsers: randomInt(100, 1000),
    requests: randomInt(5000, 50000),
    errorRate: (Math.random() * 5).toFixed(2),
    avgLatency: randomInt(50, 500),
    cpuUsage: randomInt(20, 90),
    memoryUsage: randomInt(40, 85),
  }));

  return {
    summary: {
      totalUsers: randomInt(5000, 20000),
      activeToday: randomInt(500, 3000),
      totalRequests: randomInt(100000, 1000000),
      avgResponseTime: randomInt(100, 500),
      uptime: (99 + Math.random()).toFixed(3),
      errorRate: (Math.random() * 2).toFixed(2),
    },
    timeSeries: dataPoints,
  };
}

function generateDashboardWidgets() {
  return [
    {
      id: 'widget-users',
      type: 'metric',
      title: 'Active Users',
      value: randomInt(500, 3000),
      change: (Math.random() * 20 - 10).toFixed(1),
      period: 'last 24h',
    },
    {
      id: 'widget-requests',
      type: 'metric',
      title: 'API Requests',
      value: randomInt(50000, 200000),
      change: (Math.random() * 30 - 5).toFixed(1),
      period: 'last 24h',
    },
    {
      id: 'widget-errors',
      type: 'metric',
      title: 'Error Rate',
      value: (Math.random() * 3).toFixed(2) + '%',
      change: (Math.random() * 2 - 1).toFixed(1),
      period: 'last 24h',
    },
    {
      id: 'widget-latency',
      type: 'metric',
      title: 'Avg Latency',
      value: randomInt(80, 300) + 'ms',
      change: (Math.random() * 10 - 5).toFixed(1),
      period: 'last 24h',
    },
    {
      id: 'widget-uptime',
      type: 'metric',
      title: 'Uptime',
      value: (99 + Math.random()).toFixed(3) + '%',
      change: '0.0',
      period: 'last 30d',
    },
    {
      id: 'widget-deploys',
      type: 'metric',
      title: 'Deployments',
      value: randomInt(5, 30),
      change: (Math.random() * 10).toFixed(1),
      period: 'last 7d',
    },
  ];
}

function generatePerformanceMetrics() {
  return {
    fcp: randomInt(800, 2500),
    lcp: randomInt(1500, 4000),
    cls: (Math.random() * 0.3).toFixed(3),
    fid: randomInt(10, 100),
    ttfb: randomInt(50, 500),
    inp: randomInt(50, 300),
    longTasks: randomInt(0, 10),
    domNodes: randomInt(500, 3000),
    jsHeapSize: randomInt(10, 100),
    resourceCount: randomInt(20, 80),
  };
}

function generateFeedMessage(id) {
  const messages = [
    'Deployment completed successfully on production',
    'CPU usage spike detected on server-03',
    'New user registration surge from EU region',
    'Database backup completed',
    'API rate limit threshold reached for client X',
    'Memory usage above 80% on worker-07',
    'SSL certificate renewal scheduled',
    'Cache hit ratio dropped below 90%',
    'New feature flag enabled: dark-mode',
    'Automated test suite passed: 847/847',
    'CDN cache purged for static assets',
    'Scheduled maintenance window starting',
  ];

  return {
    id: id || `msg-${Date.now()}-${randomInt(1000, 9999)}`,
    type: randomItem(feedTypes),
    message: randomItem(messages),
    timestamp: new Date().toISOString(),
    source: randomItem(['system', 'monitoring', 'ci-cd', 'security', 'infra']),
    severity: randomItem(['low', 'medium', 'high', 'critical']),
    acknowledged: false,
  };
}

export {
  generateUsers,
  generateUser,
  generateAnalytics,
  generateDashboardWidgets,
  generatePerformanceMetrics,
  generateFeedMessage,
  randomInt,
};
