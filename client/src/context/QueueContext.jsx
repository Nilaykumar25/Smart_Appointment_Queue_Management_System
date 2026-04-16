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

import { createContext, useContext, useState, useCallback } from 'react';

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
  const d = new Date();
  const liveReport = {
    date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
    totalPatientsSeen:      patients.filter((p) => p.status === 'Completed').length,
    totalNoShows:           patients.filter((p) => p.status === 'No-Show').length,
    totalCancellations:     0,
    totalBooked:            patients.filter((p) => p.status === 'Booked').length,
    totalArrived:           patients.filter((p) => p.status === 'Arrived').length,
    totalInConsultation:    patients.filter((p) => p.status === 'In-Consultation').length,
    totalAppointments:      patients.length,
    averageWaitTimeMinutes: 0,
  };

  const reorderPatients = useCallback((appointmentId, direction) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.appointmentId === appointmentId);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;

      const next = [...prev];
      // Swap the two rows
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      // Reassign queuePosition numbers to match new order
      return next.map((p, i) => ({ ...p, queuePosition: i + 1 }));
    });
  }, []);

  return (
    <QueueContext.Provider value={{ patients, updateStatus, resetPatients, reorderPatients, liveReport }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  return useContext(QueueContext);
}
