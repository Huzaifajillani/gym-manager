import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gym_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isPublic = window.location.pathname === '/login' ||
                       window.location.pathname === '/register-member';
      if (!isPublic) {
        localStorage.removeItem('gym_auth_token');
        localStorage.removeItem('gym_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
