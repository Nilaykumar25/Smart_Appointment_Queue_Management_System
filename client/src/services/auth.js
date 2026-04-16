// Implements: REQ-1 — see SRS Section 4.1 (User Registration and Authentication)

const BASE_URL = 'http://localhost:5000/api';

// Decode JWT payload without a library — works in browser
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

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

    // Role/name may come directly in response body OR inside the JWT
    const payload = data.accessToken ? decodeJWT(data.accessToken) : {};
    const role    = data.role   || payload.role   || 'patient';
    const uname   = data.name   || payload.name   || name;
    const userId  = data.userId || payload.userId || '';

    localStorage.setItem('saqms_token',   data.accessToken);
    localStorage.setItem('saqms_role',    role);
    localStorage.setItem('saqms_name',    uname);
    localStorage.setItem('saqms_user_id', userId);

    return { success: true, role, name: uname, userId };
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
    if (res.status === 400) return { success: false, message: 'Email and password are required.' };
    if (!res.ok)            return { success: false, message: data.error || 'Something went wrong.' };

    if (!data.accessToken) return { success: false, message: 'Unexpected response from server.' };

    // Role/name may come directly in response body OR inside the JWT
    const payload = decodeJWT(data.accessToken);
    const role    = data.role   || payload.role   || 'staff';
    const uname   = data.name   || payload.name   || email.split('@')[0];
    const userId  = data.userId || payload.userId || '';

    localStorage.setItem('saqms_token',   data.accessToken);
    localStorage.setItem('saqms_role',    role);
    localStorage.setItem('saqms_name',    uname);
    localStorage.setItem('saqms_user_id', userId);

    return { success: true, role, name: uname, userId };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'Could not connect to server.' };
  }
}

export async function logout() {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
    }
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('saqms_token');
    localStorage.removeItem('saqms_role');
    localStorage.removeItem('saqms_name');
    localStorage.removeItem('saqms_user_id');
  }
}

export function getToken()        { return localStorage.getItem('saqms_token')   || null; }
export function getRole()         { return localStorage.getItem('saqms_role')    || null; }
export function getName()         { return localStorage.getItem('saqms_name')    || null; }
export function getUserId()       { return localStorage.getItem('saqms_user_id') || null; }
export function isAuthenticated() { return !!localStorage.getItem('saqms_token'); }
