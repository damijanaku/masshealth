import { View, Text, SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import WorkoutIcon from '../../../assets/tsxicons/workoutnavbaricon';
import SectionTitle from '../../../components/SectionTitle';
import Routinebutton from '../../../components/RoutineButton';
import { LegendList } from '@legendapp/list';
import CurrentExerciseList from '../currentexercise';
import { useRouter } from 'expo-router';
import privateApi from '@/api';

interface Routine {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

type RoutineWorkout = {
  id: number;
  workout: {
    id: number;
    name: string;
    video_url: string;
    exercise_type: string;
    equipment_required: string;
    muscle_group: {
      id: number;
      name: string;
    };
  };
  order: number;
  workout_mode: 'reps_sets' | 'timer' | 'duration';
  custom_sets: number | null;
  custom_reps: number | null;
  timer_duration: number | null;
  duration_minutes: number | null;
  rest_between_sets: number;
  notes: string;
  effective_sets: number;
  effective_reps: number;
  effective_duration: number;
}

interface RoutineDetails {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  workouts: RoutineWorkout[];
}

const Workout = () => {
  const router = useRouter();
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<RoutineDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutines = useCallback(async () => {
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
  }, []);

  const fetchRoutineDetails = useCallback(async (routineId: number) => {
    if (!routineId) {
      setError('No routine ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await privateApi.get(`/api/auth/routines/${routineId}/`);
      
      if (response?.data) {
        setRoutine(response.data);
      }
    } catch (error) {
      console.error('Error fetching routine details:', error);
      setError('Failed to load routine details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  useEffect(() => {
    if (selectedRoutineId) {
      fetchRoutineDetails(selectedRoutineId);
    }
  }, [selectedRoutineId, fetchRoutineDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
      return () => {};
    }, [fetchRoutines])
  );

  const navigateToPreview = (routineId: number, routineName: string) => {
    router.push(`../routinepreview?routineId=${routineId}&routineName=${routineName}`);
  };

  const selectRoutine = (routineId: number, routineName: string) => {
    setSelectedRoutineId(routineId);
    setSelectedRoutine(routineName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <WorkoutIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Workout</Text>
      </View>

      <SectionTitle textOne="Your" textTwo="Workouts" />
      <View style={styles.buttonGroup}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {loadingRoutines ? (
            <Text style={styles.loadingText}>Loading workouts...</Text>
          ) : userRoutines.length > 0 ? (
            userRoutines.map((routine) => (
              <Routinebutton
                key={routine.id}
                routineName={routine.name}
                playIcon={true}
                onPress={() => selectRoutine(routine.id, routine.name)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No workouts found</Text>
          )}
        </ScrollView>
      </View>

      {selectedRoutine ? (
        <>
          <SectionTitle textTwo="Details" />
          <View style={styles.routineDetailsContainer}>
            <Text style={styles.routineDetailsText}>
              {selectedRoutine}
            </Text>
          </View>
          <CurrentExerciseList routineId={selectedRoutineId} routineName={selectedRoutine} />
        </>
      ) : (
        <>
          <SectionTitle textOne="Active" textTwo="Workout" />
          <View style={styles.currentExerciseContainer}>
            <Text style={styles.currentExerciseText}>Select a workout above</Text>
          </View>
          <CurrentExerciseList />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    marginTop: 10,
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
    color: '#6E49EB',
    margin: 10,
  },
  buttonGroup: {
    height: 160,
  },
  currentExerciseContainer: {
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentExerciseText: {
    color: 'white',
  },
  routineDetailsContainer: {
    borderRadius: 8,
    marginHorizontal: 22,
    marginBottom: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routineDetailsText: {
    color: 'white',
  },
  loadingText: {
    padding: 10,
    color: '#888',
    marginLeft: 20,
  },
  emptyText: {
    padding: 10,
    color: '#888',
    marginLeft: 20,
  },
});

export default Workout;