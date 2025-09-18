import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect } from '@react-navigation/native'
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import * as Location from "expo-location"
import { LeafletView } from 'react-native-leaflet-view'

import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon'
import SectionTitle from '@/components/SectionTitle'
import CreateRoutineButton from '@/components/createRoutineButton'
import Routinebutton from '@/components/RoutineButton'
import RoutinePlaceholder from '@/components/RoutinePlaceholder'

// API
import privateApi from '@/api'

interface Routine {
  id: number
  name: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface RoutineButtonProps {
  routineName: string
  routineId: number
  playIcon?: boolean
  onPress: (routineName: string, routineId: number) => void
}

const DEFAULT_LOCATION = {
  latitude: -23.5489,
  longitude: -46.6388,
}

const Routines: React.FC = () => {
  const router = useRouter()

  const [userRoutines, setUserRoutines] = useState<Routine[]>([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)
  const [webViewContent, setWebViewContent] = useState<string | null>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied')
        return
      }
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setLocation(currentLocation)
    } catch (error) {
      Alert.alert("Error fetching location", String(error))
    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  // Load leaflet HTML
  useEffect(() => {
    let isMounted = true

    const loadHtml = async () => {
      try {
        const path = require("@/assets/leaflet.html")
        const asset = Asset.fromModule(path)
        await asset.downloadAsync()
        const htmlContent = await FileSystem.readAsStringAsync(asset.localUri!)

        if (isMounted) setWebViewContent(htmlContent)
      } catch (error) {
        Alert.alert('Error loading HTML', JSON.stringify(error))
        console.error('Error loading HTML:', error)
      }
    }

    loadHtml()
    return () => { isMounted = false }
  }, [])

  const fetchRoutines = async () => {
    setLoadingRoutines(true)
    try {
      const response = await privateApi.get('/api/auth/routines')
      setUserRoutines(response.data.results || [])
    } catch (error) {
      console.log("Error", error)
    } finally {
      setLoadingRoutines(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutines()
    }, [])
  )

  const navigateToPreview = (routineName: string, routineId: number) => {
    router.push(`../routinepreview?routineName=${encodeURIComponent(routineName)}&routineId=${routineId}`)
  }

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.container}>
        
        <View style={styles.sectionTitle}>
          <RoutinesIcon color={"#6E49EB"} fill={"white"} />
          <Text style={styles.sectionTitleText}>Routines</Text>
        </View>

        {webViewContent ? (
          <View style={styles.mapWrapper}>
            <View style={styles.map}>
              <LeafletView
                source={{ html: webViewContent }}
                mapCenterPosition={{
                  lat: location?.coords.latitude || DEFAULT_LOCATION.latitude,
                  lng: location?.coords.longitude || DEFAULT_LOCATION.longitude,
                }}
                mapMarkers={[
                  {
                    position: {
                      lat: location?.coords.latitude || DEFAULT_LOCATION.latitude,
                      lng: location?.coords.longitude || DEFAULT_LOCATION.longitude,
                    },
                    icon: "📍", 
                    size: [32, 32],
                    title: "Your Location",
                  }
                ]}
                zoom={10}
              />
            </View>
          </View>
        ) : (
          <ActivityIndicator size="large" />
        )}

        <SectionTitle textOne='Your' textTwo='Routines' />

        <View style={styles.buttonGroup}>
          <ScrollView horizontal>
            <CreateRoutineButton onPress={() => router.push('../createroutine')} />

            {loadingRoutines ? (
              <Text style={styles.loadingText}>Loading routines...</Text>
            ) : userRoutines.length > 0 ? (
              userRoutines.map((routine) => (
                <Routinebutton
                  key={routine.id}
                  routineName={routine.name}
                  onPress={() => navigateToPreview(routine.name, routine.id)}
                />
              ))
            ) : (
              <RoutinePlaceholder />
            )}
          </ScrollView>
        </View>

      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: "#6E49EB",
    margin: 10,
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    margin: 20,
  },
  contentArea: {
    flex: 1,
    padding: 15,
  },
  contentText: {
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  loadingText: {
    padding: 10,
    color: '#888',
  },
  mapWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  map: {
    height: 250,
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
})

export default Routines
