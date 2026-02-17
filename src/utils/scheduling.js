/**
 * Scheduling utilities - microtask/macrotask helpers.
 */

function yieldToMainThread() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function nextMicrotask() {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function nextIdleCallback(timeout = 5000) {
  if (typeof requestIdleCallback !== 'undefined') {
    return new Promise((resolve) => requestIdleCallback(resolve, { timeout }));
  }
  return new Promise((resolve) => setTimeout(resolve, 1));
}

async function runInChunks(items, processFn, chunkSize = 100) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(processFn));
    if (i + chunkSize < items.length) {
      await yieldToMainThread();
    }
  }
  return results;
}

export { yieldToMainThread, nextMicrotask, nextAnimationFrame, nextIdleCallback, runInChunks };
