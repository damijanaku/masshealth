import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFocusEffect } from '@react-navigation/native'
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import * as Location from 'expo-location'
import { LeafletView } from 'react-native-leaflet-view'

import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon'
import SectionTitle from '@/components/SectionTitle'
import CreateRoutineButton from '@/components/createRoutineButton'
import Routinebutton from '@/components/RoutineButton'
import RoutinePlaceholder from '@/components/RoutinePlaceholder'
import { useMqttContext } from '@/components/MqttProvider'

import privateApi from '@/api'

interface SharedRoutine {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  challenge_id: number;
  from_user: string;
}

interface Routine {
  id: number
  name: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface Friend {
  id: string
  username: string
}

interface UserLocation {
  coords: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

const DEFAULT_LOCATION = {
  latitude: -23.5489,
  longitude: -46.6388,
}

const Routines: React.FC = () => {
  const router = useRouter()
  const mqtt = useMqttContext()
  
  const [userRoutines, setUserRoutines] = useState<Routine[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [webViewContent, setWebViewContent] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationWatchId, setLocationWatchId] = useState<Location.LocationSubscription | null>(null)
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [sharedRoutines, setSharedRoutines] = useState<SharedRoutine[]>([]);
  const [loadingSharedRoutines, setLoadingSharedRoutines] = useState(true);


  // Fetch friends list
  const fetchFriends = async () => {
    try {
      setFriendsLoading(true)
      const response = await privateApi.get('/api/auth/friends-list');
      
      if (response.data.success) {
        const friendsList = response.data.friends
        setFriends(friendsList)
        
        if (mqtt?.connected) {
          await mqtt.subscribeToFriendsLocations(friendsList)
        }
      }
    } catch (error) {
      console.error("Error fetching friends", error);
    } finally {
      setFriendsLoading(false)
    }
  };

  const fetchAcceptedChallenges = async () => {
    try {
      setLoadingSharedRoutines(true);
      
      // Get all accepted challenges where user is the receiver
      const response = await privateApi.get('/api/auth/challenges/accepted/');
      
      if (response.data.success) {
        // For each accepted challenge, fetch the routine details
        const sharedRoutinesData = await Promise.all(
          response.data.challenges.map(async (challenge: any) => {
            try {
              const routineResponse = await privateApi.get(
                `/api/auth/challenge/${challenge.id}/routine/`
              );
              
              if (routineResponse.data.success) {
                return {
                  ...routineResponse.data.routine,
                  challenge_id: challenge.id,
                  from_user: challenge.from_user.username
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching routine for challenge ${challenge.id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out null values
        setSharedRoutines(sharedRoutinesData.filter(r => r !== null));
      }
    } catch (error) {
      console.error('Error fetching accepted challenges:', error);
    } finally {
      setLoadingSharedRoutines(false);
    }
  };
  

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

  // Setup location tracking
  useEffect(() => {
    const setupLocationSharing = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          console.log('Location permission not granted')
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        
        const newUserLocation = {
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined, 
          }
        }
        
        setUserLocation(newUserLocation)

        if (mqtt?.connected) {
          await mqtt.publishLocation(
            location.coords.latitude,
            location.coords.longitude,
            location.coords.accuracy
          )
        }

        const watchId = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000, 
            distanceInterval: 50
          },
          async (newLocation) => {
            const updatedLocation = {
              coords: {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                accuracy: newLocation.coords.accuracy ?? undefined,
              }
            }
            
            setUserLocation(updatedLocation)

            if (mqtt?.connected) {
              await mqtt.publishLocation(
                newLocation.coords.latitude,
                newLocation.coords.longitude,
                newLocation.coords.accuracy
              )
            }
          }
        )

        setLocationWatchId(watchId)
      } catch (error) {
        console.error('Error setting up location sharing:', error)
      }
    }

    setupLocationSharing()

    return () => {
      if (locationWatchId) {
        locationWatchId.remove()
      }
    }
  }, [mqtt?.connected])
  

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
      fetchFriends()
      fetchAcceptedChallenges()
    }, [])
  )

  const navigateToPreview = (routineName: string, routineId: number) => {
    router.push(`../routinepreview?routineName=${encodeURIComponent(routineName)}&routineId=${routineId}`)
  }

  const createMapMarkers = () => {
    const markers = []
    console.log(mqtt?.locations)


    if (userLocation) {
      markers.push({
        position: {
          lat: userLocation.coords.latitude,
          lng: userLocation.coords.longitude,
        },
        icon: "🟢", 
        size: [32, 32] as [number, number],
        title: "Your Location",
      })
    }

    console.log(mqtt?.locations)

    if (mqtt?.locations) {
      mqtt.locations.forEach((friendLocation: { senderId: string; latitude: any; longitude: any }) => {
        const friend = friends.find(f => f.id === friendLocation.senderId)
        if (friend) {
          markers.push({
            position: {
              lat: friendLocation.latitude,
              lng: friendLocation.longitude,
            },
            icon: "🔵", // friends
            size: [28, 28] as [number, number],
            title: `${friend.username}'s Location`,
          })
        }
      })
    }

    return markers
  }

  const getMapCenter = () => {
    if (userLocation) {
      return {
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude,
      }
    }
    return {
      lat: DEFAULT_LOCATION.latitude,
      lng: DEFAULT_LOCATION.longitude,
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        
        <View style={styles.sectionTitle}>
          <RoutinesIcon color={"#6E49EB"} fill={"white"} />
          <Text style={styles.sectionTitleText}>Routines</Text>
        </View>
  
        <ScrollView 
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={true}
        >
          {webViewContent && !friendsLoading ? (
            <View style={styles.mapWrapper}>
              <View style={styles.map}>
                <LeafletView
                  source={{ html: webViewContent }}
                  mapCenterPosition={getMapCenter()}
                  mapMarkers={createMapMarkers()}
                  zoom={12}
                />
              </View>
              <Text style={styles.locationStatus}>
                📍 Sharing location with {friends.length} friends
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" />
          )}
  
          <SectionTitle textOne='Your' textTwo='Routines' />
  
          <View style={styles.buttonGroup}>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
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
  
          <SectionTitle textOne='Shared' textTwo='Routines' />
          
          <View style={styles.buttonGroup}>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {loadingSharedRoutines ? (
                <Text style={styles.loadingText}>Loading shared routines...</Text>
              ) : sharedRoutines.length > 0 ? (
                sharedRoutines.map((routine) => (
                  <View key={routine.challenge_id} style={styles.sharedRoutineContainer}>
                    <Routinebutton
                      routineName={routine.name}
                      onPress={() => navigateToPreview(routine.name, routine.id)}
                    />
                    <Text style={styles.sharedByText}>
                      Shared by @{routine.from_user}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No shared routines yet. Accept a challenge to see them here!</Text>
              )}
            </ScrollView>
          </View>
  
          <View style={{ height: 50 }} />
        </ScrollView>
  
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mainScrollView: {
    flex: 1,
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
    justifyContent: 'space-between',
    paddingTop: 10, 
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: "#6E49EB",
    margin: 10,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 20, 
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
  locationStatus: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sharedRoutineContainer: {
    marginRight: 10,
    alignItems: 'center',
  },
  sharedByText: {
    fontSize: 11,
    color: '#6E49EB',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    padding: 20,
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
})

export default Routines