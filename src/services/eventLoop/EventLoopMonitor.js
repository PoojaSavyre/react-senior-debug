/**
 * EventLoopMonitor - Monitors event loop health, detects lag, stalls, and blocking.
 *
 * Competencies: Event Loop Optimization, Event Loop Understanding
 * Bug surface: blocking operations, starvation, lag detection, phase confusion,
 *              microtask flooding, priority inversion, memory accumulation
 */

class EventLoopMonitor {
  constructor(options = {}) {
    this.sampleInterval = options.sampleInterval || 100;
    this.lagThreshold = options.lagThreshold || 50;
    this.stallThreshold = options.stallThreshold || 200;
    this.maxSamples = options.maxSamples || 1000;

    this.samples = [];
    this.listeners = new Map();
    this.monitorTimer = null;
    this.lastTick = 0;
    this.isRunning = false;

    this.stats = {
      totalSamples: 0,
      lagSpikes: 0,
      stalls: 0,
      maxLag: 0,
      avgLag: 0,
      currentLag: 0,
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTick = performance.now();
    this._tick();
  }

  stop() {
    this.isRunning = false;
    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  onLagSpike(callback) {
    return this._addListener('lagSpike', callback);
  }

  onStall(callback) {
    return this._addListener('stall', callback);
  }

  onSample(callback) {
    return this._addListener('sample', callback);
  }

  getStats() {
    return { ...this.stats };
  }

  getSamples(count) {
    return this.samples.slice(-(count || this.samples.length));
  }

  getHealthScore() {
    if (this.samples.length === 0) return 100;

    const recent = this.samples.slice(-50);
    const avgLag = recent.reduce((sum, s) => sum + s.lag, 0) / recent.length;

    // Score: 100 = perfect, 0 = completely blocked
    if (avgLag < 5) return 100;
    if (avgLag < 16) return 90;
    if (avgLag < 33) return 75;
    if (avgLag < 50) return 60;
    if (avgLag < 100) return 40;
    if (avgLag < 200) return 20;
    return 10;
  }

  reset() {
    this.samples = [];
    this.stats = {
      totalSamples: 0,
      lagSpikes: 0,
      stalls: 0,
      maxLag: 0,
      avgLag: 0,
      currentLag: 0,
    };
  }

  destroy() {
    this.stop();
    this.listeners.clear();
    this.samples = [];
  }

  // Private

  _tick() {
    if (!this.isRunning) return;

    const now = performance.now();
    const expected = this.sampleInterval;
    const actual = now - this.lastTick;
    const lag = Math.max(0, actual - expected);

    this.lastTick = now;

    const sample = {
      timestamp: Date.now(),
      expected,
      actual: Math.round(actual * 100) / 100,
      lag: Math.round(lag * 100) / 100,
    };

    this._recordSample(sample);

    // Schedule next tick
    this.monitorTimer = setTimeout(() => this._tick(), this.sampleInterval);
  }

  _recordSample(sample) {
    // Maintain bounded sample array
    if (this.samples.length >= this.maxSamples) {
      this.samples.shift();
    }
    this.samples.push(sample);

    // Update stats
    this.stats.totalSamples++;
    this.stats.currentLag = sample.lag;
    this.stats.maxLag = Math.max(this.stats.maxLag, sample.lag);

    // Running average
    const recentSamples = this.samples.slice(-100);
    this.stats.avgLag =
      Math.round(
        (recentSamples.reduce((sum, s) => sum + s.lag, 0) / recentSamples.length) * 100
      ) / 100;

    // Emit events
    this._emit('sample', sample);

    if (sample.lag > this.stallThreshold) {
      this.stats.stalls++;
      this._emit('stall', sample);
    } else if (sample.lag > this.lagThreshold) {
      this.stats.lagSpikes++;
      this._emit('lagSpike', sample);
    }
  }

  _addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
      }
    };
  }

  _emit(event, data) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventLoopMonitor] Listener error for ${event}:`, err);
        }
      });
    }
  }
}

export { EventLoopMonitor };
