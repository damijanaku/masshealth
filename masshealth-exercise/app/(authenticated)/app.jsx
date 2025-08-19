import { View, Text, Alert, StyleSheet,TouchableOpacity } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import ProtectedRoute from '../../components/ProtectedRoute'
import * as SecureStore from 'expo-secure-store'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants'

async function logout() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN)
    await SecureStore.deleteItemAsync(REFRESH_TOKEN)

    router.replace('/login')
  } catch (error) {
    console.log('Logout error', error)
    router.replace('/login')
  }
}

function handleLogout() {
  Alert.alert(
    "Logout",
    "Are you sure you want to logout?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout
      }
    ]
  )
}

function Logout() {
    SecureStore.clear()
    router.replace('/login')
}

function RegisterAndLogout() {
    SecureStore.clear()
    router.replace('/register')
}

const app = () => {
  return (
      <ProtectedRoute>
          <View style={styles.container}>
              <Text style={styles.title}>Welcome to the App!</Text>
              
              <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
              >
                  <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
          </View>
      </ProtectedRoute>
  )
}
const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  title: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 40,
      textAlign: 'center',
  },
  logoutButton: {
      backgroundColor: '#ff4444',
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
          width: 0,
          height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
  },
  logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
  },
})

export default app