import { View, Text, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon'
import { SafeAreaView } from 'react-native'
import SectionTitle from '@/components/SectionTitle'
import CreateRoutineButton from '@/components/createRoutineButton'
import Routinebutton from '@/components/RoutineButton'
import RoutinePlaceholder from '@/components/RoutinePlaceholder'
import privateApi from '@/api'
import { useFocusEffect } from '@react-navigation/native';

interface Routine {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface RoutineButtonProps {
  routineName: string;
  routineId: number; 
  playIcon?: boolean;
  onPress: (routineName: string, routineId: number) => void; 
}

const routines = () => {
  const router = useRouter()
  const [userRoutines, setUserRoutines] = useState<Routine[]>([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)

  
const navigateToPreview = (routineName: string, routineId: number) => {
  router.push(`../routinepreview?routineName=${encodeURIComponent(routineName)}&routineId=${routineId}`);
};


  const fetchRoutines = async () => {
    setLoadingRoutines(true)
    try {
      console.log('Fetching routines...');
      const response = await privateApi.get('/api/auth/routines')

      setUserRoutines(response.data.results || [])
      setLoadingRoutines(false)
      console.log(response.data)
    } catch (error) {
      console.log("Error", error)
      setLoadingRoutines(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchRoutines();
    }, [])
  );

  return (
      <GestureHandlerRootView>
        <SafeAreaView style={styles.container}>
              <View style={styles.sectionTitle}>
                  <RoutinesIcon color={"#6E49EB"} fill={"white"} />
                  <Text style={styles.sectionTitleText}>Routines</Text>
                </View>

            <SectionTitle textOne='Your' textTwo='Routines' />

            <View style={styles.buttonGroup}>
              <ScrollView horizontal={true}>
                <CreateRoutineButton onPress={() => router.push('../createroutine')}/>
                {loadingRoutines ? (
                  <Text style={styles.loadingText}>Loading routines...</Text>
                ) : userRoutines.length > 0 ? (
                  // Map through your routines and render a button for each
                  userRoutines.map((routine) => (
                    <Routinebutton 
                      key={routine.id}
                      routineName={routine.name} 
                      onPress={() => navigateToPreview(routine.name, routine.id)} 
                    />
                  ))
                ) : (
                  // placeholder if no routines are found
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
    fontWeight: 700,
    fontSize: 32,
    color: "#6E49EB",
    margin: 10
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    margin: 20
  },
    contentArea: {
    flex: 1,
    padding: 15,
  },
  contentText: {
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row'
  },
  loadingText: {
  padding: 10,
  color: '#888',
  }
})

export default routines