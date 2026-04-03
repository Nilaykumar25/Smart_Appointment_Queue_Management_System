// Shared queue state — allows ReportsPage to reflect live changes from QueueDashboard
// TODO: Remove this context when backend is connected — both pages will read from the server directly

import { createContext, useContext, useState } from 'react';

const INITIAL_PATIENTS = [
  { appointmentId: 'A001', patientName: 'Rahul Sharma',  queuePosition: 1, scheduledTime: '10:00 AM', status: 'Booked'          },
  { appointmentId: 'A002', patientName: 'Priya Singh',   queuePosition: 2, scheduledTime: '10:15 AM', status: 'Arrived'         },
  { appointmentId: 'A003', patientName: 'Amit Verma',    queuePosition: 3, scheduledTime: '10:30 AM', status: 'In-Consultation' },
  { appointmentId: 'A004', patientName: 'Sneha Patel',   queuePosition: 4, scheduledTime: '10:45 AM', status: 'Completed'       },
  { appointmentId: 'A005', patientName: 'Rohan Das',     queuePosition: 5, scheduledTime: '11:00 AM', status: 'No-Show'         },
];

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);

  function updateStatus(appointmentId, newStatus) {
    setPatients((prev) =>
      prev.map((p) =>
        p.appointmentId === appointmentId ? { ...p, status: newStatus } : p
      )
    );
  }

  function resetPatients(newList) {
    setPatients(newList);
  }

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
