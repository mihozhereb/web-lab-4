const API_BASE = '/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/register');

  const token = localStorage.getItem('authToken');

  if (!token && !isAuthEndpoint) {
    throw new Error('Пользователь не авторизован');
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('authToken');
    throw new Error('Невалидная сессия');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (_) {}

  if (!response.ok) throw new Error(data?.message || 'Ошибка запроса');
  return data;
}

export const api = {
  auth: {
    login(login, passwordHash) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, passwordHash }),
      });
    },
    register(login, passwordHash) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ login, passwordHash }),
      });
    },
    logoutLocal() {
      localStorage.removeItem('authToken');
    },
  },

  results: {
    list() {
      return request('/results', { method: 'GET' });
    },
    check(x, y, r) {
      return request('/area/check', {
        method: 'POST',
        body: JSON.stringify({ x, y, r }),
      });
    },
    clear() {
      return request('/results/clear', { method: 'POST' });
    },
  },
};
