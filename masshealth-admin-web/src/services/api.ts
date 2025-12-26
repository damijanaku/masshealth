import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    const { state } = JSON.parse(authData);
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login/', { email, password }),
  
  logout: () => apiClient.post('/api/auth/logout/'),
  
  // Users
  getUsers: () => apiClient.get('/api/auth/users/'),
  getUser: (id: number) => apiClient.get(`/api/auth/users/${id}/`),
  
  // Exercises
  getExercises: () => apiClient.get('/api/auth/workouts/'),
  
  // Routines
  getRoutines: () => apiClient.get('/api/auth/routines/'),
  
  // Stats
  getStats: () => apiClient.get('/api/auth/stats/'),
};

export default api;
