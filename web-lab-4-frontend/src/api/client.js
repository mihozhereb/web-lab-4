const API_BASE = '/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {}

  if (!response.ok) {
    const message = data?.message || 'Ошибка запроса';
    throw new Error(message);
  }

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

    register(login, passwordHash, captchaToken) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ login, passwordHash, captchaToken }),
      });
    },

    me() {
      return request('/auth/me');
    },

    logout() {
      localStorage.removeItem('authToken');
    },
  },
};
