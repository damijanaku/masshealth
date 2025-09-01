import { View, Text, StyleSheet } from 'react-native'
import { useState } from 'react'
import React from 'react'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler'
import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon'
import { SafeAreaView } from 'react-native'
import SectionTitle from '@/components/SectionTitle'
import CreateRoutineButton from '@/components/createRoutineButton'
import Routinebutton from '@/components/RoutineButton'
import RoutinePlaceholder from '@/components/RoutinePlaceholder'

const routines = () => {
  const router = useRouter()
  const [userRoutines, setUserRoutines] = useState<Array<{id: number, name: string}>>([])
  const [loadingRoutines, setLoadingRoutines] = useState(true)

  const navigateToPreview = (routineName: string) => {
    router.push(`../routinepreview?routineName=${routineName}`);
  };

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
                      onPress={() => navigateToPreview(routine.name)} 
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