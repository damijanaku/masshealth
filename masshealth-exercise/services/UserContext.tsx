import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api";
import privateApi from "../api"; 
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants";
import { Alert } from "react-native";
import { router } from "expo-router";

interface User {
  full_name: string;
  username: string;
  profile_image_url?: string;
}

interface UserContextType {
  user: User | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN);

      if (token) {
        await fetchProfile();
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false)
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setLoading(true);

    try {
      const res = await api.post('api/auth/login/', { email, password });

      await SecureStore.setItemAsync(ACCESS_TOKEN, res.data.access);
      await SecureStore.setItemAsync(REFRESH_TOKEN, res.data.refresh);
      
      await fetchProfile(); 

      try {
        const response = await privateApi.get('/api/auth/profile/get-2fa/');

        if(response.data.two_factor_auth == true){
          router.replace('/(authenticated)/faceauth?authMode=2fa')
        } else {
          router.replace("/(authenticated)/(tabs)/home");
        }
      } catch (error) {
        Alert.alert("Login Failed", JSON.stringify((error as any).response?.data));
      }

    } catch (error) {
      Alert.alert("Login Failed", JSON.stringify((error as any).response?.data));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN);
      setUser(undefined);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchProfile = async () => {
    try {
      console.log('Fetching data');

      const response = await privateApi.get('/api/auth/profile/');
      const userData = response.data;

      setUser({
        full_name: userData.full_name || userData.username || userData.email || 'User',
        username: userData.username || '',
        profile_image_url: userData.profile_image_url 
      });

      console.log('Profile loaded:', userData);
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}
