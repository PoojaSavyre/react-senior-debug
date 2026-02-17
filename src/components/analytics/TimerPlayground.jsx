/**
 * TimerPlayground - Demonstrates correct ordering and behavior of different
 * async scheduling mechanisms in the event loop.
 */

import React, { useState, useCallback, memo } from 'react';

const TimerPlayground = memo(function TimerPlayground() {
  const [log, setLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const appendLog = (entries) => {
    setLog(entries);
  };

  // Demonstrate the execution order of different async mechanisms
  const runOrderingTest = useCallback(() => {
    setIsRunning(true);
    const entries = [];
    const start = performance.now();

    const addEntry = (label, mechanism) => {
      entries.push({
        order: entries.length + 1,
        label,
        mechanism,
        time: (performance.now() - start).toFixed(2),
      });
    };

    addEntry('Synchronous', 'sync');

    // Microtask queue
    queueMicrotask(() => {
      addEntry('queueMicrotask', 'microtask');
    });

    // Promise (also microtask)
    Promise.resolve().then(() => {
      addEntry('Promise.resolve().then', 'microtask');
    });

    // setTimeout 0
    setTimeout(() => {
      addEntry('setTimeout(0)', 'macrotask');

      // Nested microtask inside macrotask
      queueMicrotask(() => {
        addEntry('Nested microtask in setTimeout', 'microtask');
      });

      // rAF
      requestAnimationFrame(() => {
        addEntry('requestAnimationFrame', 'animation');

        // requestIdleCallback (last priority)
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            addEntry('requestIdleCallback', 'idle');
            appendLog([...entries]);
            setIsRunning(false);
          });
        } else {
          appendLog([...entries]);
          setIsRunning(false);
        }
      });
    }, 0);

    // setTimeout 10ms
    setTimeout(() => {
      addEntry('setTimeout(10)', 'macrotask');
    }, 10);

    addEntry('Synchronous (end)', 'sync');
  }, []);

  // Demonstrate microtask flooding
  const runMicrotaskDemo = useCallback(() => {
    setIsRunning(true);
    const entries = [];
    const start = performance.now();

    let timeoutFired = false;

    setTimeout(() => {
      timeoutFired = true;
      entries.push({
        order: entries.length + 1,
        label: 'setTimeout (after microtasks)',
        mechanism: 'macrotask',
        time: (performance.now() - start).toFixed(2),
      });
      appendLog([...entries]);
      setIsRunning(false);
    }, 0);

    // Queue 100 microtasks - they all run before the setTimeout
    for (let i = 0; i < 100; i++) {
      queueMicrotask(() => {
        if (i === 0 || i === 49 || i === 99) {
          entries.push({
            order: entries.length + 1,
            label: `Microtask #${i + 1} (setTimeout fired: ${timeoutFired})`,
            mechanism: 'microtask',
            time: (performance.now() - start).toFixed(2),
          });
        }
      });
    }

    entries.push({
      order: entries.length + 1,
      label: 'Synchronous code (schedules 100 microtasks)',
      mechanism: 'sync',
      time: (performance.now() - start).toFixed(2),
    });
  }, []);

  // Demonstrate Promise chaining timing
  const runPromiseChainDemo = useCallback(() => {
    setIsRunning(true);
    const entries = [];
    const start = performance.now();

    const addEntry = (label, mechanism) => {
      entries.push({
        order: entries.length + 1,
        label,
        mechanism,
        time: (performance.now() - start).toFixed(2),
      });
    };

    setTimeout(() => {
      addEntry('setTimeout(0)', 'macrotask');
    }, 0);

    Promise.resolve()
      .then(() => addEntry('Promise chain 1', 'microtask'))
      .then(() => addEntry('Promise chain 2', 'microtask'))
      .then(() => addEntry('Promise chain 3', 'microtask'))
      .then(() => {
        addEntry('Promise chain 4 (final)', 'microtask');
        setTimeout(() => {
          appendLog([...entries]);
          setIsRunning(false);
        }, 50);
      });

    addEntry('Synchronous', 'sync');
  }, []);

  const getMechanismColor = (mechanism) => {
    switch (mechanism) {
      case 'sync': return '#6b7280';
      case 'microtask': return '#8b5cf6';
      case 'macrotask': return '#3b82f6';
      case 'animation': return '#10b981';
      case 'idle': return '#f59e0b';
      default: return '#374151';
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111827' }}>
        Timer & Event Loop Playground
      </h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        Run experiments to understand event loop execution order.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={runOrderingTest} disabled={isRunning} style={demoBtn}>
          Execution Order
        </button>
        <button onClick={runMicrotaskDemo} disabled={isRunning} style={demoBtn}>
          Microtask Flooding
        </button>
        <button onClick={runPromiseChainDemo} disabled={isRunning} style={demoBtn}>
          Promise Chain
        </button>
        <button onClick={() => setLog([])} style={demoBtn}>
          Clear
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['sync', 'microtask', 'macrotask', 'animation', 'idle'].map((type) => (
          <span key={type} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: getMechanismColor(type),
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getMechanismColor(type),
            }} />
            {type}
          </span>
        ))}
      </div>

      {/* Log */}
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        {log.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
            Click a button to run an experiment
          </div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              padding: '6px 10px',
              borderBottom: '1px solid #f3f4f6',
              alignItems: 'center',
            }}>
              <span style={{ width: '20px', color: '#9ca3af', textAlign: 'right' }}>
                {entry.order}
              </span>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getMechanismColor(entry.mechanism),
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, color: '#1f2937' }}>{entry.label}</span>
              <span style={{ color: '#6b7280', fontSize: '11px' }}>{entry.time}ms</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const demoBtn = {
  padding: '6px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
};

export { TimerPlayground };
