const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── In-Memory Token Management (RAM Only) ──────────────────────────────────
let _accessToken = null;
let _refreshPromise = null;
let _isLoggingOut = false;

export function getAccessToken() {
  return _accessToken;
}

export function setAccessToken(token) {
  _accessToken = token;
}

/**
 * Tự động gọi API refresh token để lấy Access Token mới từ HTTP-Only Cookie
 */
export async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        return null;
      }

      const data = await response.json();
      if (data.access) {
        setAccessToken(data.access);
        if (data.user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data.access;
      }
      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * Khởi tạo phiên làm việc khi trang web được nạp lại
 */
export async function initAuth() {
  if (typeof window === 'undefined') return null;
  if (_isLoggingOut) return null; // Chặn silent refresh nếu đang trong quá trình đăng xuất
  localStorage.removeItem('token'); // Xóa token cũ lưu ở localStorage nếu có
  
  let token = getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
  }

  if (token) {
    try {
      const user = await getMe();
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      // Nếu token cũ hỏng/hết hạn, thử refresh lại 1 lần
      const newToken = await refreshAccessToken();
      if (newToken) {
        try {
          const user = await getMe();
          localStorage.setItem('user', JSON.stringify(user));
          return user;
        } catch {
          return null;
        }
      }
      return null;
    }
  }
  return null;
}

/**
 * Base request helper to handle in-memory auth tokens and automatic silent refresh
 */
export async function request(path, options = {}) {
  let token = getAccessToken();
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  // Set default Content-Type to application/json only if body is not FormData
  if (!options.body || !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Tự động silent refresh khi Access Token hết hạn (401)
  if (response.status === 401 && path !== '/accounts/login/' && path !== '/accounts/register/' && path !== '/accounts/token/refresh/') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
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
  if (data.access) {
    setAccessToken(data.access);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }
  }
  return data;
}

export async function register(fullName, email, password) {
  const data = await request('/accounts/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (data.access) {
    setAccessToken(data.access);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }
  }
  return data;
}

export async function logout() {
  // Optimistic UI: Xoá state liền ngay lập tức
  _isLoggingOut = true;
  setAccessToken(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Gọi API ngầm ở background
  try {
    await request('/accounts/logout/', { method: 'POST' });
  } catch {}
  
  // Trả cờ về false sau khi hoàn thành (đề phòng user ở lại trang)
  setTimeout(() => { _isLoggingOut = false; }, 2000);
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

export async function resetPassword(uid, token, newPassword) {
  return request('/accounts/reset-password/', {
    method: 'POST',
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });
}

export async function validateResetToken(uid, token) {
  return request('/accounts/reset-password/validate/', {
    method: 'POST',
    body: JSON.stringify({ uid, token }),
  });
}

export async function verifyEmail(token) {
  return request(`/accounts/verify-email/?token=${encodeURIComponent(token)}`);
}

export async function resendVerification(email) {
  return request('/accounts/resend-verification/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}



export async function updateProfile(data) {
  return request('/accounts/profile/update/', {
    method: 'POST',
    body: JSON.stringify(data),
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
  let body = data;
  if (data.file) {
    body = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined && key !== 'file') {
        if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
          body.append(key, JSON.stringify(data[key]));
        } else {
          body.append(key, data[key]);
        }
      }
    }
    body.append('attachment', data.file);
  } else {
    body = JSON.stringify(data);
  }
  
  return request('/events/', {
    method: 'POST',
    body,
  });
}

export async function updateEvent(id, data) {
  let body = data;
  if (data.file || data.file === null) {
    body = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && key !== 'file') {
        if (data[key] === null) {
          body.append(key, '');
        } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
          body.append(key, JSON.stringify(data[key]));
        } else {
          body.append(key, data[key]);
        }
      }
    }
    if (data.file instanceof File) {
      body.append('attachment', data.file);
    } else if (data.file === null) {
      body.append('attachment', '');
    }
  } else {
    body = JSON.stringify(data);
  }

  return request(`/events/${id}/`, {
    method: 'PATCH',
    body,
  });
}

export async function getEvent(id) {
  return request(`/events/${id}/`);
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

export async function deleteNote(id) {
  return request(`/notes/${id}/`, { method: 'DELETE' });
}

export async function togglePinNote(id) {
  return request(`/notes/${id}/toggle_pin/`, { method: 'POST' });
}

// ─── SETTINGS ──────────────────────────────────────────────────────────────
/**
 * GET /api/accounts/settings/
 * Backend trả về flat snake_case → map sang camelCase cho Frontend
 */
export async function getSettings() {
  const data = await request('/accounts/settings/');
  if (!data) return {};

  const normalizeNotificationType = (value) => {
    if (value === 'screen') return 'app';
    if (value === 'push') return 'email';
    if (value === 'email' || value === 'app' || value === 'both' || value === 'off') return value;
    return 'both';
  };

  // Map snake_case → camelCase (flat)
  return {
    theme:                  data.theme               ?? 'light',
    language:               data.language            ?? 'vi',
    region:                 data.region              ?? 'VN',
    dateFormat:             data.date_format         ?? 'DD/MM/YYYY',
    timeFormat:             data.time_format         ?? '24h',
    firstDayOfWeek:         data.first_day_of_week   ?? 1,
    primaryTimezone:        data.primary_timezone    ?? 'Asia/Ho_Chi_Minh',
    secondaryTimezone:      data.secondary_timezone  ?? null,
    showSecondaryTimezone:  data.show_secondary_timezone ?? false,
    defaultLocation:        data.default_location    ?? '',
    defaultMeetLink:        data.default_meet_link   ?? '',
    notificationType:       normalizeNotificationType(data.notification_type),
    notificationMinutes:    data.notification_minutes ?? 10,
    showWeekends:           data.show_weekends        ?? true,
    showCompletedTasks:     data.show_completed_tasks ?? true,
    showWeekNumbers:        data.show_week_numbers    ?? false,
    showDeclinedEvents:     data.show_declined_events ?? false,
    dimPastEvents:          data.dim_past_events      ?? true,
    weekStartDay:           data.week_start_day       ?? 'monday',
    phoneNumber:            data.phone_number         ?? '',
    // Nếu server trả về danh mục tuỳ chỉnh thì dùng, ngược lại giữ 4 mặc định
    customCategories:       (data.custom_categories && data.custom_categories.length > 0)
                              ? data.custom_categories
                              : ['Mặc định', 'Công việc', 'Gia đình', 'Cá nhân'],
  };
}

/**
 * PATCH /api/accounts/settings/
 * Frontend gửi camelCase → map sang snake_case cho Backend
 */
export async function updateSettings(flatData) {
  const snakeData = {
    theme:                   flatData.theme,
    language:                flatData.language,
    region:                  flatData.region,
    date_format:             flatData.dateFormat,
    time_format:             flatData.timeFormat,
    first_day_of_week:       flatData.firstDayOfWeek,
    primary_timezone:        flatData.primaryTimezone,
    secondary_timezone:      flatData.secondaryTimezone,
    show_secondary_timezone: flatData.showSecondaryTimezone,
    default_location:        flatData.defaultLocation,
    default_meet_link:       flatData.defaultMeetLink,
    notification_type:       flatData.notificationType,
    notification_minutes:    flatData.notificationMinutes,
    show_weekends:           flatData.showWeekends,
    show_completed_tasks:    flatData.showCompletedTasks,
    show_week_numbers:       flatData.showWeekNumbers,
    show_declined_events:    flatData.showDeclinedEvents,
    dim_past_events:         flatData.dimPastEvents,
    week_start_day:          flatData.weekStartDay,
    custom_categories:       flatData.customCategories,
  };
  // Lọc bỏ các key undefined
  Object.keys(snakeData).forEach(k => snakeData[k] === undefined && delete snakeData[k]);

  return request('/accounts/settings/', {
    method: 'PATCH',
    body: JSON.stringify(snakeData),
  });
}

export async function saveCustomCategories(categories) {
  return request('/accounts/settings/', {
    method: 'PATCH',
    body: JSON.stringify({ custom_categories: categories }),
  });
}

// ─── FAVORITE CALENDARS ─────────────────────────────────────────────────────
/** GET  /api/accounts/favorite-calendars/ */
export async function getFavoriteCalendars() {
  return request('/accounts/favorite-calendars/');
}

/**
 * POST /api/accounts/favorite-calendars/
 * Thêm lịch yêu thích. Nếu calendar_key đã tồn tại → toggle is_active.
 * @param {object} payload { calendar_key?, calendar_group?, name?, color?, is_active? }
 */
export async function addFavoriteCalendar(payload) {
  return request('/accounts/favorite-calendars/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/accounts/favorite-calendars/<id>/ */
export async function updateFavoriteCalendar(id, payload) {
  return request(`/accounts/favorite-calendars/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** DELETE /api/accounts/favorite-calendars/<id>/ */
export async function removeFavoriteCalendar(id) {
  return request(`/accounts/favorite-calendars/${id}/`, { method: 'DELETE' });
}

