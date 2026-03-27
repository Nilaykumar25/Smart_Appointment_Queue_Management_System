/**
 * ========================================
 * QUEUE TEST HELPER COMPONENT (DEV ONLY)
 * ========================================
 * Temporary component to test queue features
 * REQ-7: Queue Position Display
 * REQ-8: Estimated Wait Time Display
 * 
 * This component helps test the queue functionality
 * by allowing manual setup of queue data.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QueueTest = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState(3);
  const [waitTime, setWaitTime] = useState(15);

  // REQ-7 & REQ-8: Set Queue Data Function
  const setQueueData = () => {
    const queueData = {
      position: parseInt(position),
      estimatedWaitTime: parseInt(waitTime)
    };
    localStorage.setItem('userQueueData', JSON.stringify(queueData));
    alert(`✅ Queue data set! Position: ${position}, Wait Time: ${waitTime} min\nRedirecting to dashboard...`);
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  // Clear Queue Data Function
  const clearQueueData = () => {
    localStorage.removeItem('userQueueData');
    alert('✅ Queue data cleared!\nRedirecting to dashboard...');
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: '#f5f5f5',
      borderRadius: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🧪 Queue Feature Test</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Use this page to test REQ-7 (Queue Position) and REQ-8 (Estimated Wait Time) features.
      </p>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '2px solid #e0e0e0'
      }}>
        <h3>Test 1: Patient in Queue</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Queue Position (REQ-7):
          </label>
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            min="1"
            max="100"
          />
          <small style={{ color: '#999' }}>Enter patient's position in queue (1-100)</small>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Estimated Wait Time (REQ-8):
          </label>
          <input
            type="number"
            value={waitTime}
            onChange={(e) => setWaitTime(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            min="0"
            max="480"
          />
          <small style={{ color: '#999' }}>Enter wait time in minutes (0-480)</small>
        </div>

        <button
          onClick={setQueueData}
          style={{
            backgroundColor: '#667eea',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginRight: '0.5rem',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5568d3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
        >
          ✅ Set Queue Data
        </button>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '2px solid #ffc107',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0 }}>Test 2: Clear Queue (Not in Queue)</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          This will clear all queue data and show the default "not in queue" message.
        </p>
        <button
          onClick={clearQueueData}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          🗑️ Clear Queue Data
        </button>
      </div>

      <div style={{
        backgroundColor: '#d4edda',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '2px solid #28a745',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0 }}>📋 Current Data</h3>
        <pre style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          overflow: 'auto',
          fontSize: '0.9rem'
        }}>
{`localStorage.userQueueData = ${
  localStorage.getItem('userQueueData') || 'null'
}`}
        </pre>
      </div>

      <div style={{
        backgroundColor: '#e7f3ff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '2px solid #0066cc',
        marginTop: '1.5rem'
      }}>
        <h3 style={{ marginTop: 0 }}>ℹ️ How to Use</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Enter a queue position and wait time above</li>
          <li>Click "Set Queue Data" button</li>
          <li>You'll be redirected to the dashboard</li>
          <li>The queue status section will show your position and wait time</li>
          <li>Click "Clear Queue Data" to test the empty state</li>
        </ol>
      </div>
    </div>
  );
};

export default QueueTest;
