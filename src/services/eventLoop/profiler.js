/**
 * Event Loop Profiler - Measures timing across different event loop phases.
 */

class EventLoopProfiler {
  constructor() {
    this.measurements = [];
    this.maxMeasurements = 500;
    this.isProfileActive = false;
    this.profileSession = null;
  }

  /**
   * Measure the timing of different async scheduling mechanisms.
   * Demonstrates the correct ordering of event loop phases.
   */
  async measurePhases() {
    const results = {
      startTime: performance.now(),
      phases: [],
    };

    return new Promise((resolve) => {
      const order = [];

      // 1. Microtask (Promise.then / queueMicrotask) - runs first
      queueMicrotask(() => {
        order.push({
          phase: 'microtask',
          time: performance.now() - results.startTime,
          mechanism: 'queueMicrotask',
        });
      });

      // 2. Promise resolution - also microtask
      Promise.resolve().then(() => {
        order.push({
          phase: 'microtask',
          time: performance.now() - results.startTime,
          mechanism: 'Promise.resolve().then',
        });
      });

      // 3. setTimeout(0) - macrotask, runs after all microtasks
      setTimeout(() => {
        order.push({
          phase: 'macrotask',
          time: performance.now() - results.startTime,
          mechanism: 'setTimeout(0)',
        });

        // 4. requestAnimationFrame - runs before next paint
        requestAnimationFrame((timestamp) => {
          order.push({
            phase: 'animation',
            time: performance.now() - results.startTime,
            mechanism: 'requestAnimationFrame',
            frameTimestamp: timestamp,
          });

          // 5. requestIdleCallback - runs when browser is idle
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback((deadline) => {
              order.push({
                phase: 'idle',
                time: performance.now() - results.startTime,
                mechanism: 'requestIdleCallback',
                timeRemaining: deadline.timeRemaining(),
              });

              results.phases = order;
              results.endTime = performance.now();
              results.totalDuration = results.endTime - results.startTime;
              resolve(results);
            });
          } else {
            results.phases = order;
            results.endTime = performance.now();
            results.totalDuration = results.endTime - results.startTime;
            resolve(results);
          }
        });
      }, 0);
    });
  }

  /**
   * Measure the cost of blocking the event loop for a given duration.
   * Used to demonstrate why long synchronous tasks are harmful.
   */
  measureBlockingImpact(blockDurationMs = 50) {
    return new Promise((resolve) => {
      const metrics = {
        blockDuration: blockDurationMs,
        beforeBlock: performance.now(),
        rAFDelay: null,
        timeoutDelay: null,
        microtaskDelay: null,
      };

      // Schedule observers before blocking
      const timeoutStart = performance.now();
      setTimeout(() => {
        metrics.timeoutDelay = performance.now() - timeoutStart;
      }, 0);

      const rAFStart = performance.now();
      requestAnimationFrame(() => {
        metrics.rAFDelay = performance.now() - rAFStart;
      });

      const microtaskStart = performance.now();
      queueMicrotask(() => {
        metrics.microtaskDelay = performance.now() - microtaskStart;
      });

      // Block the event loop
      const blockEnd = performance.now() + blockDurationMs;
      while (performance.now() < blockEnd) {
        // Intentional blocking for measurement
      }

      metrics.afterBlock = performance.now();
      metrics.actualBlockTime = metrics.afterBlock - metrics.beforeBlock;

      // Wait for all callbacks to fire
      setTimeout(() => {
        resolve(metrics);
      }, 100);
    });
  }

  /**
   * Start continuous profiling session.
   */
  startProfiling(intervalMs = 500) {
    if (this.isProfileActive) return;
    this.isProfileActive = true;

    this.profileSession = {
      startedAt: Date.now(),
      samples: [],
    };

    const sample = () => {
      if (!this.isProfileActive) return;

      const start = performance.now();

      setTimeout(() => {
        const lag = performance.now() - start;
        const entry = {
          timestamp: Date.now(),
          eventLoopLag: Math.round(lag * 100) / 100,
        };

        this.profileSession.samples.push(entry);

        if (this.profileSession.samples.length > this.maxMeasurements) {
          this.profileSession.samples.shift();
        }

        if (this.isProfileActive) {
          setTimeout(sample, intervalMs);
        }
      }, 0);
    };

    sample();
  }

  /**
   * Stop profiling and return results.
   */
  stopProfiling() {
    this.isProfileActive = false;
    const session = this.profileSession;
    this.profileSession = null;

    if (!session) return null;

    const samples = session.samples;
    const lags = samples.map((s) => s.eventLoopLag);

    return {
      duration: Date.now() - session.startedAt,
      sampleCount: samples.length,
      avgLag: lags.length > 0 ? lags.reduce((a, b) => a + b, 0) / lags.length : 0,
      maxLag: lags.length > 0 ? Math.max(...lags) : 0,
      minLag: lags.length > 0 ? Math.min(...lags) : 0,
      p95Lag: this._percentile(lags, 95),
      p99Lag: this._percentile(lags, 99),
      samples,
    };
  }

  _percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export { EventLoopProfiler };
