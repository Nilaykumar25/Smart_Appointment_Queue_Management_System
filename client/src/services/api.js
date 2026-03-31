// Implements: REQ-1, REQ-2 — see SRS Section 4.1 and 7.4

import { getToken } from './auth';

const BASE_URL = 'http://localhost:5000/api';

export async function apiCall(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers,
    ...(options.body && typeof options.body === 'object'
      ? { body: JSON.stringify(options.body) }
      : {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!res.ok) {
    const err = new Error(`HTTP error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}
