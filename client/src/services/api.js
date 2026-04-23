// Implements: REQ-1, REQ-2 — see SRS Section 4.1 and 7.4

import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiCall(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
    ...(options.body && typeof options.body === 'object'
      ? { body: JSON.stringify(options.body) }
      : {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!res.ok) {
    let errorMessage = `HTTP error ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use default error message
    }
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
