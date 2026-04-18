const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Base request helper to handle auth tokens and common headers
 */
export async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Extract error message from Django REST Framework default error formats
    const errorMsg = errorData.detail || errorData.error || (typeof errorData === 'object' ? Object.values(errorData)[0] : null);
    throw new Error(errorMsg || 'Liên kết máy chủ thất bại');
  }

  return response.status === 204 ? null : response.json();
}

// ─── AUTH ──────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await request('/accounts/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function register(fullName, email, password) {
  const data = await request('/accounts/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function logout() {
  await request('/accounts/logout/', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('token');
}

export async function getMe() {
  return request('/accounts/me/');
}

export async function forgotPassword(email) {
  return request('/accounts/forgot-password/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ─── EVENTS ────────────────────────────────────────────────────────────────
export async function getEvents(params = {}) {
  let url = '/events/';
  const query = new URLSearchParams(params).toString();
  if (query) url += `?${query}`;
  return request(url);
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

export async function deleteEvent(id) {
  return request(`/events/${id}/`, { method: 'DELETE' });
}

export async function trashEvent(id) {
  return request(`/events/${id}/trash/`, { method: 'POST' });
}

export async function restoreEvent(id) {
  return request(`/events/${id}/restore/`, { method: 'POST' });
}

export async function permanentDeleteEvent(id) {
  return request(`/events/${id}/permanent_delete/`, { method: 'POST' });
}

export async function getTrashedEvents() {
  return request('/events/trashed/');
}

export async function leaveEvent(id) {
  return request(`/events/${id}/leave/`, { method: 'POST' });
}

// ─── TASKS ─────────────────────────────────────────────────────────────────
export async function getTasks(params = {}) {
  let url = '/tasks/';
  const query = new URLSearchParams(params).toString();
  if (query) url += `?${query}`;
  return request(url);
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

export async function deleteTask(id) {
  return request(`/tasks/${id}/`, { method: 'DELETE' });
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
  return request(`/tasks/${id}/permanent_delete/`, { method: 'POST' });
}

export async function getTrashedTasks() {
  return request('/tasks/trashed/');
}

// ─── CONTACTS ──────────────────────────────────────────────────────────────
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

// ─── CONNECTIONS (Social) ──────────────────────────────────────────────────
export async function searchUserByEmail(email) {
  return request(`/contacts/search/by_email/?email=${encodeURIComponent(email)}`);
}

export async function sendConnectionRequest(receiverId) {
  return request('/contacts/connections/', {
    method: 'POST',
    body: JSON.stringify({ receiver: receiverId }),
  });
}

export async function getFriends() {
  return request('/contacts/connections/friends/');
}

export async function getInvitations() {
  return request('/contacts/connections/invitations/');
}

export async function acceptInvitation(id) {
  return request(`/contacts/connections/${id}/accept/`, { method: 'POST' });
}

export async function declineInvitation(id) {
  return request(`/contacts/connections/${id}/decline/`, { method: 'POST' });
}

export async function blockConnection(id) {
  return request(`/contacts/connections/${id}/block/`, { method: 'POST' });
}

export async function togglePinConnection(id) {
  return request(`/contacts/connections/${id}/toggle_pin/`, { method: 'POST' });
}

// ─── MESSAGES (Chat) ───────────────────────────────────────────────────────
export async function getMessages(connectionId) {
  return request(`/contacts/messages/?connection=${connectionId}`);
}

export async function markMessagesRead(connectionId) {
  return request(`/contacts/messages/mark_read/?connection=${connectionId}`, { method: 'POST' });
}

export async function sendMessage(connectionId, text) {
  return request('/contacts/messages/', {
    method: 'POST',
    body: JSON.stringify({ connection: connectionId, text }),
  });
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
export async function getNotifications() {
  return request('/events/notifications/');
}

export async function acceptEventInvitation(id, force = false) {
  return request(`/events/invitations/${id}/accept/`, { 
    method: 'POST',
    body: JSON.stringify({ force })
  });
}

export async function declineEventInvitation(id) {
  return request(`/events/invitations/${id}/decline/`, { method: 'POST' });
}

export async function markNotificationRead(id) {
  return request(`/events/notifications/${id}/mark_read/`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return request('/events/notifications/mark_all_as_read/', { method: 'POST' });
}

export async function deleteAllNotifications() {
  return request('/events/notifications/delete_all/', { method: 'DELETE' });
}

// ─── SUPPORT ───────────────────────────────────────────────────────────────
export async function submitSupportRequest(data) {
    return request('/support/submit/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ─── NOTES (Keep) ──────────────────────────────────────────────────────────
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

export async function deleteNote(id) {
  return request(`/notes/${id}/`, { method: 'DELETE' });
}

export async function togglePinNote(id) {
  return request(`/notes/${id}/toggle_pin/`, { method: 'POST' });
}
