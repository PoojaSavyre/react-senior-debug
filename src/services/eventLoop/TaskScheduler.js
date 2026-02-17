/**
 * TaskScheduler - Schedules work across different event loop phases properly.
 * Uses requestIdleCallback, requestAnimationFrame, queueMicrotask, setTimeout.
 */

const PRIORITY = {
  CRITICAL: 0,   // queueMicrotask - runs before anything else in current tick
  HIGH: 1,       // requestAnimationFrame - runs before next paint
  NORMAL: 2,     // setTimeout(0) - runs in next macrotask
  LOW: 3,        // requestIdleCallback - runs when browser is idle
};

class TaskScheduler {
  constructor() {
    this.taskQueue = new Map();
    this.taskIdCounter = 0;
    this.isProcessing = false;
    this.cancelTokens = new Map();
  }

  /**
   * Schedule a task with a specific priority.
   * Returns a cancel function.
   */
  schedule(task, priority = PRIORITY.NORMAL, options = {}) {
    const taskId = ++this.taskIdCounter;
    const taskEntry = {
      id: taskId,
      task,
      priority,
      scheduledAt: performance.now(),
      options,
    };

    this.taskQueue.set(taskId, taskEntry);

    let cancelToken;

    switch (priority) {
      case PRIORITY.CRITICAL:
        queueMicrotask(() => this._executeTask(taskId));
        break;

      case PRIORITY.HIGH:
        cancelToken = requestAnimationFrame(() => this._executeTask(taskId));
        this.cancelTokens.set(taskId, { type: 'raf', token: cancelToken });
        break;

      case PRIORITY.NORMAL:
        cancelToken = setTimeout(() => this._executeTask(taskId), options.delay || 0);
        this.cancelTokens.set(taskId, { type: 'timeout', token: cancelToken });
        break;

      case PRIORITY.LOW:
        if (typeof requestIdleCallback !== 'undefined') {
          cancelToken = requestIdleCallback(
            (deadline) => this._executeIdleTask(taskId, deadline),
            { timeout: options.timeout || 5000 }
          );
          this.cancelTokens.set(taskId, { type: 'idle', token: cancelToken });
        } else {
          // Fallback for browsers without requestIdleCallback
          cancelToken = setTimeout(() => this._executeTask(taskId), 50);
          this.cancelTokens.set(taskId, { type: 'timeout', token: cancelToken });
        }
        break;

      default:
        cancelToken = setTimeout(() => this._executeTask(taskId), 0);
        this.cancelTokens.set(taskId, { type: 'timeout', token: cancelToken });
    }

    return () => this._cancelTask(taskId);
  }

  /**
   * Schedule a batch of work that yields to the event loop between chunks.
   * Prevents blocking the main thread with long-running synchronous tasks.
   */
  async scheduleBatch(items, processFn, options = {}) {
    const chunkSize = options.chunkSize || 10;
    const yieldInterval = options.yieldInterval || 16; // ~1 frame
    const results = [];
    let lastYield = performance.now();

    for (let i = 0; i < items.length; i++) {
      results.push(processFn(items[i], i));

      // Yield to event loop periodically
      if (performance.now() - lastYield > yieldInterval) {
        await this._yieldToEventLoop();
        lastYield = performance.now();

        if (options.onProgress) {
          options.onProgress(i + 1, items.length);
        }
      }
    }

    return results;
  }

  /**
   * Run a function during the next animation frame with measurement.
   */
  scheduleVisualUpdate(fn) {
    return new Promise((resolve) => {
      const token = requestAnimationFrame((timestamp) => {
        const result = fn(timestamp);
        resolve(result);
      });
      return () => cancelAnimationFrame(token);
    });
  }

  /**
   * Schedule work to run when the main thread is idle.
   */
  scheduleIdleWork(fn, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(
          (deadline) => {
            try {
              const result = fn(deadline);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          },
          { timeout }
        );
      } else {
        setTimeout(() => {
          try {
            const result = fn({ timeRemaining: () => 50, didTimeout: false });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }, 1);
      }
    });
  }

  getPendingCount() {
    return this.taskQueue.size;
  }

  cancelAll() {
    this.cancelTokens.forEach((cancel, taskId) => {
      this._cancelTask(taskId);
    });
    this.taskQueue.clear();
    this.cancelTokens.clear();
  }

  destroy() {
    this.cancelAll();
  }

  // Private

  _executeTask(taskId) {
    const taskEntry = this.taskQueue.get(taskId);
    if (!taskEntry) return;

    this.taskQueue.delete(taskId);
    this.cancelTokens.delete(taskId);

    try {
      const executionTime = performance.now() - taskEntry.scheduledAt;
      taskEntry.task({ executionTime, taskId });
    } catch (err) {
      console.error(`[TaskScheduler] Task ${taskId} failed:`, err);
    }
  }

  _executeIdleTask(taskId, deadline) {
    const taskEntry = this.taskQueue.get(taskId);
    if (!taskEntry) return;

    this.taskQueue.delete(taskId);
    this.cancelTokens.delete(taskId);

    try {
      taskEntry.task({
        timeRemaining: deadline.timeRemaining(),
        didTimeout: deadline.didTimeout,
        taskId,
      });
    } catch (err) {
      console.error(`[TaskScheduler] Idle task ${taskId} failed:`, err);
    }
  }

  _cancelTask(taskId) {
    this.taskQueue.delete(taskId);
    const cancel = this.cancelTokens.get(taskId);

    if (cancel) {
      switch (cancel.type) {
        case 'raf':
          cancelAnimationFrame(cancel.token);
          break;
        case 'timeout':
          clearTimeout(cancel.token);
          break;
        case 'idle':
          if (typeof cancelIdleCallback !== 'undefined') {
            cancelIdleCallback(cancel.token);
          }
          break;
      }
      this.cancelTokens.delete(taskId);
    }
  }

  _yieldToEventLoop() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export { TaskScheduler, PRIORITY };
