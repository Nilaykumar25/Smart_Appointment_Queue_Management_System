// Implements: REQ-1 — see SRS Section 4.1 (User Registration and Authentication)

const BASE_URL = 'http://localhost:5000/api';

export async function register(name, email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, role: 'patient' }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.error || 'Registration failed.' };

    localStorage.setItem('saqms_token', data.accessToken);
    localStorage.setItem('saqms_role', data.role);
    localStorage.setItem('saqms_name', data.name);
    localStorage.setItem('saqms_user_id', data.userId);

    return { success: true, role: data.role, name: data.name, userId: data.userId };
  } catch {
    return { success: false, message: 'Could not connect to server.' };
  }
}

export async function login(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.status === 401) return { success: false, message: 'Invalid email or password.' };
    if (res.status === 423) return { success: false, message: 'Account locked. Try again in 15 minutes.' };
    if (!res.ok) return { success: false, message: data.error || 'Something went wrong.' };

    localStorage.setItem('saqms_token', data.accessToken);
    localStorage.setItem('saqms_role', data.role);
    localStorage.setItem('saqms_name', data.name);
    localStorage.setItem('saqms_user_id', data.userId);

    return { success: true, role: data.role, name: data.name, userId: data.userId };
  } catch {
    return { success: false, message: 'Could not connect to server.' };
  }
}

export function logout() {
  localStorage.removeItem('saqms_token');
  localStorage.removeItem('saqms_role');
  localStorage.removeItem('saqms_name');
  localStorage.removeItem('saqms_user_id');
}

export function getToken()  { return localStorage.getItem('saqms_token')   || null; }
export function getRole()   { return localStorage.getItem('saqms_role')    || null; }
export function getName()   { return localStorage.getItem('saqms_name')    || null; }
export function getUserId() { return localStorage.getItem('saqms_user_id') || null; }
export function isAuthenticated() { return !!localStorage.getItem('saqms_token'); }
