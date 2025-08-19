import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';
import { publicApi } from '../api';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN);
      
      if (!refreshToken) {
        return false;
      }

      const res = await publicApi.post('/api/auth/token/refresh/', { 
        refresh: refreshToken 
      });
      
      if (res.status === 200) {
        await SecureStore.setItemAsync(ACCESS_TOKEN, res.data.access);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Token refresh error:', error);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN);
      return false;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN);
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const decodedToken = jwtDecode(token);
      const tokenExpiration = decodedToken.exp;
      const now = Date.now() / 1000;

      if (tokenExpiration && tokenExpiration < now) {
        const refreshSuccessful = await refreshToken();
        setIsAuthenticated(refreshSuccessful);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Go directly to the tabs, not to a redirect page
        router.replace('/(authenticated)/(tabs)/home');
      } else {
        router.replace('/entry');
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="entry" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
    </Stack>
  );
}