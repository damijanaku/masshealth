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
  
  register: (data: { email: string; password: string; full_name: string }) =>
    apiClient.post('/api/auth/register/', data),
  
  logout: () => apiClient.post('/api/auth/logout/'),
  
  refreshToken: () => apiClient.post('/api/auth/token/refresh/'),
  
  // Profile
  getProfile: () => apiClient.get('/api/auth/profile/'),
  updateProfile: (data: object) => apiClient.put('/api/auth/profile/', data),
  getProfileMetadata: () => apiClient.get('/api/auth/profile/metadata/'),
  uploadProfileImage: (formData: FormData) => 
    apiClient.post('/api/auth/profile/upload-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  // Friends
  searchUsers: (query: string) => apiClient.get(`/api/auth/search-users/?q=${query}`),
  sendFriendRequest: (userId: number) => apiClient.post(`/api/auth/send-friend-request/${userId}/`),
  acceptFriendRequest: (requestId: number) => apiClient.post(`/api/auth/accept-friend-request/${requestId}/`),
  getPendingRequests: () => apiClient.get('/api/auth/pending-requests/'),
  getFriendsList: () => apiClient.get('/api/auth/friends-list/'),
  
  // Workouts
  getWorkouts: () => apiClient.get('/api/auth/workouts/'),
  getWorkoutsByMuscleGroup: (muscleGroup: string) => 
    apiClient.get(`/api/auth/workouts/muscle-group/${muscleGroup}/`),
  getMuscleGroups: () => apiClient.get('/api/auth/muscle-groups/'),
  getWorkoutModes: () => apiClient.get('/api/auth/workout-modes/'),
  
  // Routines
  getRoutines: () => apiClient.get('/api/auth/routines/'),
  getRoutine: (id: number) => apiClient.get(`/api/auth/routines/${id}/`),
  createRoutine: (data: object) => apiClient.post('/api/auth/routines/create/', data),
  createRoutineWithWorkouts: (data: object) => 
    apiClient.post('/api/auth/routines/create-with-workouts/', data),
  updateRoutine: (id: number, data: object) => apiClient.put(`/api/auth/routines/${id}/update/`, data),
  deleteRoutine: (id: number) => apiClient.delete(`/api/auth/routines/${id}/delete/`),
  getRoutineWorkouts: (routineId: number) => apiClient.get(`/api/auth/routines/${routineId}/workouts/`),
  addWorkoutToRoutine: (routineId: number, data: object) => 
    apiClient.post(`/api/auth/routines/${routineId}/workouts/add/`, data),
  removeWorkoutFromRoutine: (routineId: number, workoutOrder: number) => 
    apiClient.delete(`/api/auth/routines/${routineId}/workouts/${workoutOrder}/delete/`),
  
  // MQTT
  getMqttCredentials: () => apiClient.get('/api/auth/mqtt/credentials/'),
};

export default api;