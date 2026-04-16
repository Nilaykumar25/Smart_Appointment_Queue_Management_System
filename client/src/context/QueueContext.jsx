// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-7: Queue Management Context — Real-time position tracking
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * Queue Position Mapping:
 *   - queuePosition field represents patient's place in doctor's queue
 *   - Lower numbers = closer to being attended
 *   - Positions recalculate when staff marks patients as "Attended" or "Completed"
 *   - Context syncs with QueueDashboard updates via localStorage or API polling
 *
 * Status Mapping for Queue Inclusion:
 *   - "Booked"           → In queue (waiting to arrive)
 *   - "Arrived"          → In queue (physically present)
 *   - "In-Consultation"  → In queue but being attended
 *   - "Completed"        → Removed from queue (attended)
 *   - "No-Show"          → Removed from queue (didn't show up)
 */

// Shared queue state — allows ReportsPage to reflect live changes from QueueDashboard
// TODO: Remove this context when backend is connected — both pages will read from the server directly

import { createContext, useContext, useState, useCallback } from 'react';

const INITIAL_PATIENTS = [
  { appointmentId: 'A001', patientName: 'Rahul Sharma',  queuePosition: 1, scheduledTime: '10:00 AM', status: 'Booked'          },
  { appointmentId: 'A002', patientName: 'Priya Singh',   queuePosition: 2, scheduledTime: '10:15 AM', status: 'Arrived'         },
  { appointmentId: 'A003', patientName: 'Amit Verma',    queuePosition: 3, scheduledTime: '10:30 AM', status: 'In-Consultation' },
  { appointmentId: 'A004', patientName: 'Sneha Patel',   queuePosition: 4, scheduledTime: '10:45 AM', status: 'Completed'       },
  { appointmentId: 'A005', patientName: 'Rohan Das',     queuePosition: 5, scheduledTime: '11:00 AM', status: 'No-Show'         },
];

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [patients, setPatients] = useState([]);

  /**
   * updateStatus — Updates a single patient's status in the queue
   * REQ-7 Mapping: When status changes to "Completed" or "No-Show",
   * server automatically recalculates positions for remaining patients
   */
  const updateStatus = useCallback((appointmentId, newStatus) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.appointmentId === appointmentId ? { ...p, status: newStatus } : p
      )
    );
  }, []);

  /**
   * resetPatients — Replaces entire queue with new list from server
   * Called after server recalculates positions (when a patient is marked as attended)
   */
  const resetPatients = useCallback((newList) => {
    setPatients(newList);
  }, []);

  // Derived report stats computed live from current patient states
  const liveReport = {
    date:                   new Date().toISOString().split('T')[0],
    totalPatientsSeen:      patients.filter((p) => p.status === 'Completed').length,
    totalNoShows:           patients.filter((p) => p.status === 'No-Show').length,
    totalCancellations:     0, // no cancellation flow in frontend yet
    averageWaitTimeMinutes: 18, // static until backend provides real data
  };

  return (
    <QueueContext.Provider value={{ patients, updateStatus, resetPatients, liveReport }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
