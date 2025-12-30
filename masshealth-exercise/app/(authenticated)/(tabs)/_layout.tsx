import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { router, Tabs } from 'expo-router'
import { Svg } from 'react-native-svg'
import Activity from '../../../assets/tsxicons/activitynavbaricon';
import Profile from '../../../assets/tsxicons/profilenavbaricon';
import Workout from '../../../assets/tsxicons/workoutnavbaricon';
import RoutinesIcon from '../../../assets/tsxicons/routinesnavbaricon';
import HomeIcon from '../../../assets/tsxicons/homenavbaricon';
import ProtectedRoute from '@/components/ProtectedRoute';

const LoggedLayout = () => {
  return (
    <ProtectedRoute>
        <Tabs
        screenOptions={{
          headerShown: false,
        }}>
          <Tabs.Screen
              name="home"
              options={{
                  title: "Home",
                  headerShown: false,
                  tabBarActiveTintColor: "#6E49EB",
                  tabBarIcon: ({ color }) => (
                  <HomeIcon width={24} height={24} color={color} />
                  ),
              }}
              />
          <Tabs.Screen
              name="routines"
              options={{
              title: "Routines",
              tabBarActiveTintColor: "#6E49EB",
              headerShown: false,
              tabBarIcon: ({ color }) => (
                  <RoutinesIcon width={24} height={24} color={color} />
              ),
              }} />

          <Tabs.Screen
              name="workout"
              options={{
              title: "Workout",
              tabBarActiveTintColor: "#6E49EB",
              headerShown: false,
              tabBarIcon: ({ color }) => (
                  <Workout width={24} height={24} color={color} />
              ),
              }} />

          <Tabs.Screen
              name="activity"
              options={{
              title: "Challenge",
              tabBarActiveTintColor: "#6E49EB",
              headerShown: false,
              tabBarIcon: ({ color }) => (
                  <Activity width={24} height={24} color={color} />
              ),
              }} />
          <Tabs.Screen
              name="profile"
              options={{
              title: "Profile",
              tabBarActiveTintColor: "#6E49EB",
              headerShown: false,
              tabBarIcon: ({ color }) => (
                  <Profile width={24} height={24} color={color} />
              ),
              }} />

              
              
        
      </Tabs>
    </ProtectedRoute>
    
    
  )
}

export default LoggedLayout