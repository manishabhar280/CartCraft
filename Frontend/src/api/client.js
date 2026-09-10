import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cartcraft_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasStoredToken = Boolean(localStorage.getItem('cartcraft_token'));

    if (error?.response?.status === 401 && hasStoredToken) {
      localStorage.removeItem('cartcraft_token');
      localStorage.removeItem('cartcraft_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
