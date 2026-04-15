/**
 * lib/api.js — Centralized API service layer
 * Tất cả calls tới Django backend đều đi qua đây.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// ─── Helpers ───────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

function getHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    // Ném lỗi với message từ BE
    const msg = typeof data === 'object'
      ? Object.values(data).flat().join(' ')
      : String(data);
    throw new Error(msg || `Lỗi ${res.status}`);
  }
  return data;
}

// ─── AUTH ───────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request('/accounts/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) localStorage.setItem('authToken', data.token);
  return data; // { token, user }
}

export async function register(fullName, email, password) {
  const data = await request('/accounts/register/', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
  if (data.token) localStorage.setItem('authToken', data.token);
  return data; // { token, user }
}

export async function logout() {
  try {
    await request('/accounts/logout/', { method: 'POST' });
  } finally {
    localStorage.removeItem('authToken');
  }
}

export async function getMe() {
  return request('/accounts/me/');
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────
export async function getEvents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/events/${qs ? '?' + qs : ''}`);
}

export async function createEvent(data) {
  return request('/events/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return request(`/events/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function trashEvent(id) {
  return request(`/events/${id}/trash/`, { method: 'POST' });
}

export async function restoreEvent(id) {
  return request(`/events/${id}/restore/`, { method: 'POST' });
}

export async function permanentDeleteEvent(id) {
  return request(`/events/${id}/permanent/`, { method: 'DELETE' });
}

export async function getTrashedEvents() {
  return request('/events/trash/');
}

// ─── TASKS ──────────────────────────────────────────────────────────────────
export async function getTasks(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/tasks/${qs ? '?' + qs : ''}`);
}

export async function createTask(data) {
  return request('/tasks/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id, data) {
  return request(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleTask(id) {
  return request(`/tasks/${id}/toggle/`, { method: 'POST' });
}

export async function trashTask(id) {
  return request(`/tasks/${id}/trash/`, { method: 'POST' });
}

export async function restoreTask(id) {
  return request(`/tasks/${id}/restore/`, { method: 'POST' });
}

export async function permanentDeleteTask(id) {
  return request(`/tasks/${id}/permanent/`, { method: 'DELETE' });
}

export async function getTrashedTasks() {
  return request('/tasks/trash/');
}

// ─── NOTES ──────────────────────────────────────────────────────────────────
export async function getNotes() {
  return request('/notes/');
}

export async function createNote(data) {
  return request('/notes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(id, data) {
  return request(`/notes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function togglePinNote(id) {
  return request(`/notes/${id}/toggle_pin/`, { method: 'POST' });
}

export async function deleteNote(id) {
  return request(`/notes/${id}/`, { method: 'DELETE' });
}

// ─── CONTACTS ───────────────────────────────────────────────────────────────
export async function getContacts() {
  return request('/contacts/');
}

export async function createContact(data) {
  return request('/contacts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(id, data) {
  return request(`/contacts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id) {
  return request(`/contacts/${id}/`, { method: 'DELETE' });
}
