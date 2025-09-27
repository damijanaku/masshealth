import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'; 
import { router } from 'expo-router'; 
import React, { useState, useEffect, useContext } from 'react'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/GoogleButton';
import Input from '../components/Input';
import DefButton from '../components/DefButton';
import api from '../api'
import * as SecureStore from 'expo-secure-store'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';
import { useUser } from '@/hooks/useUser';


const login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showReset, setShowReset] = useState(false)
  const { login, loading } = useUser();

  useEffect(() => {
  }, [])

  async function handleLogin() {

    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    await login(email, password);

  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container2}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.h2}>Log into your MassHealth Account</Text>

        <GoogleButton 
          onPress={() => console.log('Google login pressed')} 
          text="Sign in with Google"
        />
        
        <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
          <View style={{flex: 1, height: 1, backgroundColor: 'black',}} />
          <View>
            <Text style={{width: 50, textAlign: 'center'}}>Ali</Text>
          </View>
          <View style={{flex: 1, height: 1, backgroundColor: 'black', margin: 10}} />
        </View>
        
        <Input
          placeholder='Email'
          inputMode='email'
          value={email}
          onChangeText={setEmail}
        />
        
        <Input
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
        
        <DefButton
          onPress={() => handleLogin()}
          text="Log in!"
        />
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Not registered yet!? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '600'
  },
  h2: {
    fontSize: 25,
    opacity: 0.6,
  },
  container2: {
    marginTop: '20%',
    marginBottom: '20%',
    paddingHorizontal: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#8a2be2',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  registerText: {
    fontSize: 14,
    color: '#555',
  },
  registerLink: {
    fontSize: 14,
    color: '#8a2be2',
    fontWeight: '500'
  }
});

export default login;















