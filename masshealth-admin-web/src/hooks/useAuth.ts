import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, logout: storeLogout } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.login(email, password);
      const { user, access } = response.data;
      
      if (!user.is_admin) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      setAuth(user, access);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      storeLogout();
    }
  };

  return { login, logout, loading, error };
}
