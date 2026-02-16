/**
 * HeavyComputation - Component that offloads heavy work to avoid blocking the event loop.
 *
 * Competency: Event Loop Optimization, Event Loop Understanding
 * Bug surface: blocking event loop operations, event loop starvation, stalling,
 *              blocking IO, priority misunderstanding
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { TaskScheduler, PRIORITY } from '../../services/eventLoop/TaskScheduler';

const scheduler = new TaskScheduler();

const HeavyComputation = memo(function HeavyComputation() {
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('worker');
  const cancelRef = useRef(null);

  // Non-blocking computation using batch scheduling
  const runNonBlocking = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    const items = Array.from({ length: 10000 }, (_, i) => i);

    try {
      const results = await scheduler.scheduleBatch(
        items,
        (item) => {
          // Simulate CPU-intensive work per item
          let sum = 0;
          for (let j = 0; j < 1000; j++) {
            sum += Math.sqrt(item * j);
          }
          return sum;
        },
        {
          chunkSize: 100,
          yieldInterval: 8,
          onProgress: (done, total) => {
            setProgress(Math.round((done / total) * 100));
          },
        }
      );

      const total = results.reduce((a, b) => a + b, 0);
      setResult({
        sum: total.toFixed(2),
        items: items.length,
        method: 'Non-blocking (batch scheduler)',
      });
    } catch (err) {
      setResult({ error: err.message });
    }

    setIsRunning(false);
  }, []);

  // Web Worker computation
  const runWorker = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    try {
      const workerCode = `
        self.onmessage = function(e) {
          const { items } = e.data;
          let processed = 0;
          let sum = 0;
          
          for (let i = 0; i < items; i++) {
            let itemSum = 0;
            for (let j = 0; j < 1000; j++) {
              itemSum += Math.sqrt(i * j);
            }
            sum += itemSum;
            processed++;
            
            if (processed % 1000 === 0) {
              self.postMessage({ type: 'progress', progress: Math.round((processed / items) * 100) });
            }
          }
          
          self.postMessage({ type: 'done', sum: sum.toFixed(2), items: items });
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);

      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setProgress(e.data.progress);
        } else if (e.data.type === 'done') {
          setResult({
            sum: e.data.sum,
            items: e.data.items,
            method: 'Web Worker (off main thread)',
          });
          setIsRunning(false);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        }
      };

      worker.onerror = (err) => {
        setResult({ error: err.message });
        setIsRunning(false);
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage({ items: 10000 });
    } catch (err) {
      setResult({ error: err.message });
      setIsRunning(false);
    }
  }, []);

  // Idle callback computation
  const runIdle = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    const totalItems = 10000;
    let processed = 0;
    let sum = 0;

    const processChunk = (deadline) => {
      while (processed < totalItems && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
        let itemSum = 0;
        for (let j = 0; j < 1000; j++) {
          itemSum += Math.sqrt(processed * j);
        }
        sum += itemSum;
        processed++;

        if (processed % 500 === 0) {
          setProgress(Math.round((processed / totalItems) * 100));
        }
      }

      if (processed < totalItems) {
        requestIdleCallback(processChunk, { timeout: 2000 });
      } else {
        setResult({
          sum: sum.toFixed(2),
          items: totalItems,
          method: 'requestIdleCallback (idle time)',
        });
        setIsRunning(false);
      }
    };

    requestIdleCallback(processChunk, { timeout: 2000 });
  }, []);

  // BLOCKING computation - runs synchronously on main thread (the anti-pattern)
  // Bug surface: blocks event loop, freezes UI, prevents paint updates
  const runBlocking = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    // Use setTimeout to allow the "Processing..." state to render first
    setTimeout(() => {
      const start = performance.now();
      const items = 10000;
      let sum = 0;

      for (let i = 0; i < items; i++) {
        for (let j = 0; j < 1000; j++) {
          sum += Math.sqrt(i * j);
        }
      }

      const elapsed = performance.now() - start;
      setProgress(100);
      setResult({
        sum: sum.toFixed(2),
        items,
        method: `Main Thread BLOCKING (${elapsed.toFixed(0)}ms freeze)`,
      });
      setIsRunning(false);
    }, 50);
  }, []);

  const handleRun = useCallback(() => {
    switch (mode) {
      case 'worker':
        runWorker();
        break;
      case 'nonblocking':
        runNonBlocking();
        break;
      case 'idle':
        runIdle();
        break;
      case 'blocking':
        runBlocking();
        break;
    }
  }, [mode, runWorker, runNonBlocking, runIdle, runBlocking]);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>
        Heavy Computation
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        Process 10,000 items with CPU-intensive calculations without blocking the event loop.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { value: 'worker', label: 'Web Worker' },
          { value: 'nonblocking', label: 'Batch Scheduler' },
          { value: 'idle', label: 'Idle Callback' },
          { value: 'blocking', label: 'Main Thread (BLOCKING)' },
        ].map((opt) => (
          <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="mode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={(e) => setMode(e.target.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning}
        style={{
          padding: '8px 20px',
          backgroundColor: isRunning ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          marginBottom: '16px',
        }}
      >
        {isRunning ? 'Processing...' : 'Run Computation'}
      </button>

      {isRunning && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            height: '6px',
            backgroundColor: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              transition: 'width 0.1s',
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{progress}%</div>
        </div>
      )}

      {result && !result.error && (
        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
            Computation complete!
          </div>
          <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
            Sum: {result.sum} | Items: {result.items} | Method: {result.method}
          </div>
        </div>
      )}

      {result?.error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '14px', color: '#991b1b' }}>Error: {result.error}</div>
        </div>
      )}
    </div>
  );
});

export { HeavyComputation };
