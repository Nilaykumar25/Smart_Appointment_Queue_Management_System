// Implements: REQ-1, REQ-2 — see SRS Section 4.1 and 7.4

import { getToken, refreshToken } from './auth';

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

  let res = await fetch(`${BASE_URL}${endpoint}`, config);

  // If we get a 401 and have a token, try to refresh it
  if (res.status === 401 && token) {
    console.log('[API] Got 401, attempting token refresh...');
    const refreshResult = await refreshToken();
    
    if (refreshResult.success) {
      console.log('[API] Token refreshed successfully, retrying request...');
      // Retry the request with the new token
      const newToken = getToken();
      config.headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${endpoint}`, config);
    } else {
      console.log('[API] Token refresh failed:', refreshResult.message);
      // Refresh failed, let the 401 error propagate
    }
  }

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
