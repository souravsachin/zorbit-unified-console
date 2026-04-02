import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zorbit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on login/register/callback pages — prevents infinite loop
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/auth/callback') && !path.startsWith('/payments/')) {
        localStorage.removeItem('zorbit_token');
        localStorage.removeItem('zorbit_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
