import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleButton from '../components/GoogleButton';
import Input from '../components/Input'
import DefButton from '../components/DefButton';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { publicApi } from '../api' // Use publicApi instead of default api
import * as SecureStore from 'expo-secure-store'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';

const Register = () => {
    const [name, setName] = useState('')
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('')
    const [loading, setLoading] = useState(false)

    const OnRegisterPressed = () => {
        registerUser();
    }

    async function registerUser() {
        setLoading(true);
        try {
            // Use publicApi for registration (no auth headers)
            const res = await publicApi.post("/api/auth/register/", {
                email: email,
                username: username,
                full_name: name,
                password: password,
                password_confirm: passwordRepeat
            });

            await SecureStore.setItemAsync(ACCESS_TOKEN, res.data.access)
            await SecureStore.setItemAsync(REFRESH_TOKEN, res.data.refresh)

            router.replace('/(authenticated)/app')
        } catch (error: any) {
            console.log('Registration error:', error.response?.data);
            Alert.alert("Registration Failed", 
                error.response?.data?.message || 
                JSON.stringify(error.response?.data) || 
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView>
                    <View style={styles.container2}>
                        <Text style={styles.title}>
                            Register
                        </Text>
                        <GoogleButton 
                            onPress={() => console.log('Google pressed')} 
                            text="Sign Up with Google"
                        />
                        <View style={{flexDirection: 'row', alignItems: 'center', margin: 10}}>
                            <View style={{flex: 1, height: 1, backgroundColor: 'black',}} />
                            <View>
                                <Text style={{width: 50, textAlign: 'center'}}>Ali</Text>
                            </View>
                            <View style={{flex: 1, height: 1, backgroundColor: 'black', margin: 10}} />
                        </View>
                        <Input
                            placeholder='Full name'
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            placeholder='Email'
                            value={email}
                            onChangeText={setEmail}
                        />
                        <Input
                            placeholder='Username'
                            value={username}
                            onChangeText={setUsername}
                        />
                        <Input
                            placeholder='Password'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                        />
                        <Input
                            placeholder='Password repeat'
                            value={passwordRepeat}
                            onChangeText={setPasswordRepeat}
                            secureTextEntry={true}
                        />
                        <DefButton 
                            onPress={OnRegisterPressed}
                            text="Register"
                        />
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Already have an account!? </Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.registerLink}>Log in!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    title: {
        fontSize: 40,
        fontWeight: '600'
    },
    h2: {
        fontSize: 24,
        opacity: 0.6,
    },
    container2: {
        marginTop: '15%',
        marginBottom: '20%',
        paddingHorizontal: 20
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
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

export default Register