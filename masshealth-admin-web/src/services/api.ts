import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const publicEndpoints = ['/api/auth/login/', '/api/auth/register/'];

apiClient.interceptors.request.use((config) => {
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  if (!isPublicEndpoint) {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state.token) config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

const api = {
  login: (email: string, password: string) => apiClient.post('/api/auth/login/', { email, password }),
  register: (data: { email: string; password: string; full_name: string }) => apiClient.post('/api/auth/register/', data),
  logout: () => apiClient.post('/api/auth/logout/'),
  refreshToken: () => apiClient.post('/api/auth/token/refresh/'),
  
  getProfile: () => apiClient.get('/api/auth/profile/'),
  updateProfile: (data: object) => apiClient.put('/api/auth/profile/', data),
  getProfileMetadata: () => apiClient.get('/api/auth/profile/metadata/'),
  uploadProfileImage: (formData: FormData) => apiClient.post('/api/auth/profile/upload-image/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  
  searchUsers: (query: string) => apiClient.get(`/api/auth/search-users/?q=${query}`),
  sendFriendRequest: (userId: number) => apiClient.post(`/api/auth/send-friend-request/${userId}/`),
  acceptFriendRequest: (requestId: number) => apiClient.post(`/api/auth/accept-friend-request/${requestId}/`),
  getPendingRequests: () => apiClient.get('/api/auth/pending-requests/'),
  getFriendsList: () => apiClient.get('/api/auth/friends-list/'),
  
  getWorkouts: () => apiClient.get('/api/auth/workouts/'),
  getWorkoutsByMuscleGroup: (muscleGroup: string) => apiClient.get(`/api/auth/workouts/muscle-group/${muscleGroup}/`),
  getMuscleGroups: () => apiClient.get('/api/auth/muscle-groups/'),
  getWorkoutModes: () => apiClient.get('/api/auth/workout-modes/'),
  
  getRoutines: () => apiClient.get('/api/auth/routines/'),
  getRoutine: (id: number) => apiClient.get(`/api/auth/routines/${id}/`),
  createRoutine: (data: object) => apiClient.post('/api/auth/routines/create/', data),
  createRoutineWithWorkouts: (data: object) => apiClient.post('/api/auth/routines/create-with-workouts/', data),
  updateRoutine: (id: number, data: object) => apiClient.put(`/api/auth/routines/${id}/update/`, data),
  deleteRoutine: (id: number) => apiClient.delete(`/api/auth/routines/${id}/delete/`),
  getRoutineWorkouts: (routineId: number) => apiClient.get(`/api/auth/routines/${routineId}/workouts/`),
  addWorkoutToRoutine: (routineId: number, data: object) => apiClient.post(`/api/auth/routines/${routineId}/workouts/add/`, data),
  removeWorkoutFromRoutine: (routineId: number, workoutOrder: number) => apiClient.delete(`/api/auth/routines/${routineId}/workouts/${workoutOrder}/delete/`),
  
  getMqttCredentials: () => apiClient.get('/api/auth/mqtt/credentials/'),

  checkAdmin: () => apiClient.get('/api/auth/admin/check/'),
  getDashboardStats: () => apiClient.get('/api/auth/admin/stats/'),
  listAdmins: () => apiClient.get('/api/auth/admin/list/'),
  listAllUsers: (page = 1, perPage = 20) => apiClient.get(`/api/auth/admin/users/?page=${page}&per_page=${perPage}`),
  createAdmin: (data: { email: string; password: string; full_name: string; username: string; is_superuser?: boolean }) => apiClient.post('/api/auth/admin/create/', data),
  promoteToAdmin: (userId: number, isSuperuser = false) => apiClient.post(`/api/auth/admin/promote/${userId}/`, { is_superuser: isSuperuser }),
  demoteAdmin: (userId: number) => apiClient.post(`/api/auth/admin/demote/${userId}/`),
  deleteUser: (userId: number) => apiClient.delete(`/api/auth/admin/delete/${userId}/`),
  updateUser: (userId: number, data: { full_name?: string; is_active?: boolean; is_staff?: boolean; is_superuser?: boolean; password?: string }) => apiClient.put(`/api/auth/admin/users/${userId}/`, data),
  sendPasswordReset: (userId: number) => apiClient.post(`/api/auth/admin/users/${userId}/send-reset/`),

  getSounds: () => apiClient.get('/api/auth/admin/sounds/'),
  uploadSound: (formData: FormData) => apiClient.post('/api/auth/admin/sounds/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteSound: (soundId: string) => apiClient.delete(`/api/auth/admin/sounds/${soundId}/`),

  importExercises: (exercises: object[]) => apiClient.post('/api/auth/admin/exercises/import/', { exercises }),
};

export default api;