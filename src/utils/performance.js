/**
 * Performance measurement utilities.
 *
 * Competency: React Performance Analysis
 */

function measureRenderTime(fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
}

function createPerformanceTracker(name) {
  const marks = new Map();

  return {
    mark(label) {
      marks.set(label, performance.now());
    },

    measure(from, to) {
      const start = marks.get(from);
      const end = marks.get(to);
      if (start !== undefined && end !== undefined) {
        return end - start;
      }
      return null;
    },

    clear() {
      marks.clear();
    },

    getAll() {
      return Object.fromEntries(marks);
    },
  };
}

function observeLongTasks(callback) {
  if (typeof PerformanceObserver === 'undefined') return () => {};

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback({
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name,
        });
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
    return () => observer.disconnect();
  } catch (e) {
    return () => {};
  }
}

export { measureRenderTime, createPerformanceTracker, observeLongTasks };
