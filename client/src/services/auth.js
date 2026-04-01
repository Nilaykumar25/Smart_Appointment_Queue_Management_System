// Implements: REQ-1 — see SRS Section 4.1 (User Registration and Authentication)

const BASE_URL = 'http://localhost:5000/api';

export async function login(email, password) {
  // TEMP MOCK — remove when backend is running
  // TODO: REQ-1 — connect to real backend when server DB is ready
  if (email && password) {
    const mockRole = email.includes('admin') ? 'admin' : 'staff';
    localStorage.setItem('saqms_token', 'mock.jwt.token');
    localStorage.setItem('saqms_role', mockRole);
    localStorage.setItem('saqms_name', 'Amitansh');
    return { success: true, role: mockRole, name: 'Amitansh' };
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 401) return { success: false, message: 'Invalid email or password.' };
    if (res.status === 423) return { success: false, message: 'Account locked. Try again in 15 minutes.' };
    if (!res.ok) return { success: false, message: 'Something went wrong. Please try again.' };

    const data = await res.json();

    // TODO: Remove mock response when backend DB is ready
    const token = data.accessToken ?? 'mock.jwt.token';
    const role  = data.role  ?? 'admin';
    const name  = data.name  ?? 'Amitansh';

    localStorage.setItem('saqms_token', token);
    localStorage.setItem('saqms_role',  role);
    localStorage.setItem('saqms_name',  name);

    return { success: true, role, name };
  } catch {
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}

export function logout() {
  localStorage.removeItem('saqms_token');
  localStorage.removeItem('saqms_role');
  localStorage.removeItem('saqms_name');
}

export function getToken() {
  return localStorage.getItem('saqms_token') || null;
}

export function getRole() {
  return localStorage.getItem('saqms_role') || null;
}

export function getName() {
  return localStorage.getItem('saqms_name') || null;
}

export function isAuthenticated() {
  return !!localStorage.getItem('saqms_token');
}
