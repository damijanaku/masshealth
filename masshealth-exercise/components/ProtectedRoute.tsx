import { View, Text } from 'react-native'
import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import * as SecureStore from 'expo-secure-store'
import api from '../api'
import { router } from 'expo-router'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants'

interface ProtectedRouteProps {
    children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false))
    }, [])

    const refreshToken = async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN)
            
            if (!refreshToken) {
                setIsAuthorized(false)
                return
            }

            const res = await api.post('/api/auth/token/refresh/', { refresh: refreshToken })
            
            if (res.status === 200) {
                await SecureStore.setItemAsync(ACCESS_TOKEN, res.data.access)
                setIsAuthorized(true)
            } else {
                setIsAuthorized(false)
            }
        } catch (error) {
            console.log(error)
            setIsAuthorized(false)
            // Clean up invalid tokens
            await SecureStore.deleteItemAsync(ACCESS_TOKEN)
            await SecureStore.deleteItemAsync(REFRESH_TOKEN)
        }
    }

    const auth = async () => {
        try {
            const token = await SecureStore.getItemAsync(ACCESS_TOKEN)
            
            if (!token) {
                setIsAuthorized(false)
                return
            }

            const decodedToken = jwtDecode(token)
            const tokenExpiration = decodedToken.exp
            const now = Date.now() / 1000

            if (tokenExpiration && tokenExpiration < now) {
                await refreshToken()
            } else {
                setIsAuthorized(true)
            }
        } catch (error) {
            console.log('Auth error:', error)
            setIsAuthorized(false)
        }
    }

    if (isAuthorized === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        )
    }

    if (!isAuthorized) {
        router.replace('/login')
        return null
    }

    return <>{children}</>
}

export default ProtectedRoute