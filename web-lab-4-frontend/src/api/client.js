const API_BASE = '/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('authToken');
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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
