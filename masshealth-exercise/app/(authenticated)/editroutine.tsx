import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import BackIcon from '../../assets/tsxicons/backicon'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Input from '../../components/Input'
import DefButton from '../../components/DefButton'
import { LegendList } from '@legendapp/list'
import privateApi from '@/api'

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

type RoutineDetail = {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  workouts: RoutineWorkout[];
  total_estimated_duration: number;
}

const EditRoutine = () => {
  const { routineId } = useLocalSearchParams();
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [workouts, setWorkouts] = useState<RoutineWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutineData();
  }, [routineId]);

  const fetchRoutineData = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await privateApi.get(`/api/auth/routines/${routineId}/`);

      if (response) {
        const routineData: RoutineDetail = response.data;
        setRoutineName(routineData.name);
        setRoutineDescription(routineData.description);
        setWorkouts(routineData.workouts);
      } else {
        console.error('Failed to fetch routine data');
        setError('Failed to load routine data');
      }
    } catch (error) {
      console.error('Error fetching routine:', error);
      setError('Error loading routine');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkoutValue = (workoutId: number, field: keyof RoutineWorkout, value: any) => {
    setWorkouts(prevWorkouts => {
      return prevWorkouts.map(workout => 
        workout.id === workoutId ? { ...workout, [field]: value } : workout
      );
    });
  };

  const handleNumericInputChange = (
    text: string, 
    workoutId: number, 
    field: 'custom_sets' | 'custom_reps' | 'timer_duration' | 'duration_minutes' | 'rest_between_sets'
  ) => {
    if (text === '') {
      updateWorkoutValue(workoutId, field, null);
      return;
    }
    
    const numericValue = parseInt(text);
    if (!isNaN(numericValue)) {
      updateWorkoutValue(workoutId, field, numericValue);
    }
  };

  const toggleWorkoutMode = (workoutId: number) => {
    setWorkouts(prevWorkouts => {
      return prevWorkouts.map(workout => {
        if (workout.id === workoutId) {
          let newMode: 'reps_sets' | 'timer' | 'duration';
          
          if (workout.workout_mode === 'reps_sets') {
            newMode = 'timer';
          } else if (workout.workout_mode === 'timer') {
            newMode = 'duration';
          } else {
            newMode = 'reps_sets';
          }
          
          return { ...workout, workout_mode: newMode };
        }
        return workout;
      });
    });
  };

  const getDisplayValue = (customValue: number | null, effectiveValue: number) => {
    if (customValue === null) return '';
    return (customValue ?? effectiveValue).toString();
  };

  const renderWorkoutModeControls = (item: RoutineWorkout) => {
    switch (item.workout_mode) {
      case 'reps_sets':
        return (
          <View style={styles.editRow}>
            <View style={styles.editItem}>
              <Text style={styles.editLabel}>Sets:</Text>
              <TextInput
                style={styles.editInput}
                keyboardType="numeric"
                value={getDisplayValue(item.custom_sets, item.effective_sets)}
                onChangeText={(value) => 
                  handleNumericInputChange(value, item.id, 'custom_sets')
                }
                placeholder={item.effective_sets.toString()}
              />
            </View>
            <View style={styles.editItem}>
              <Text style={styles.editLabel}>Reps:</Text>
              <TextInput
                style={styles.editInput}
                keyboardType="numeric"
                value={getDisplayValue(item.custom_reps, item.effective_reps)}
                onChangeText={(value) => 
                  handleNumericInputChange(value, item.id, 'custom_reps')
                }
                placeholder={item.effective_reps.toString()}
              />
            </View>
          </View>
        );
        
      case 'timer':
        return (
          <View style={styles.editItem}>
            <Text style={styles.editLabel}>Timer (seconds):</Text>
            <TextInput
              style={styles.editInput}
              keyboardType="numeric"
              value={item.timer_duration === null ? '' : item.timer_duration.toString()}
              onChangeText={(value) => 
                handleNumericInputChange(value, item.id, 'timer_duration')
              }
              placeholder="300"
            />
          </View>
        );
        
      case 'duration':
        return (
          <View style={styles.editItem}>
            <Text style={styles.editLabel}>Duration (minutes):</Text>
            <TextInput
              style={styles.editInput}
              keyboardType="numeric"
              value={getDisplayValue(item.duration_minutes, item.effective_duration)}
              onChangeText={(value) => 
                handleNumericInputChange(value, item.id, 'duration_minutes')
              }
              placeholder={item.effective_duration.toString()}
            />
          </View>
        );
        
      default:
        return null;
    }
  };

  const handleSaveRoutine = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const routineResponse = await privateApi.put(`/api/auth/routines/${routineId}/update/`, {
        name: routineName,
        description: routineDescription,
      });
  
      if (routineResponse.status !== 200) {
        throw new Error('Failed to update routine');
      }
  
      for (const workout of workouts) {
        try {
          const updateResponse = await privateApi.put(
            `/api/auth/routines/${routineId}/workouts/${workout.order}/`,
            {
              workout_mode: workout.workout_mode,
              custom_sets: workout.custom_sets,
              custom_reps: workout.custom_reps,
              timer_duration: workout.timer_duration,
              duration_minutes: workout.duration_minutes,
              rest_between_sets: workout.rest_between_sets,
              notes: workout.notes,
            }
          );
  
          if (updateResponse.status !== 200) {
            console.error(`Failed to update workout ${workout.id}:`, updateResponse.data);
          }
        } catch (workoutError) {
          console.error(`Error updating workout ${workout.id}:`, workoutError);
        }
      }
  
      router.back();
      
    } catch (error) {
      console.error('Error saving routine:', error);
      setError('Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.title}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.back()}>
              <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
            </TouchableOpacity>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>Edit Routine</Text>
          </View>
        </View>
        <Text style={styles.loadingText}>Loading routine...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Edit Routine</Text>
        </View>
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Routine name</Text>
      </View>
      <Input
        value={routineName}
        onChangeText={setRoutineName}
        style={styles.inputContainer}
      />
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Description</Text>
      </View>
      <Input
        value={routineDescription}
        onChangeText={setRoutineDescription}
        style={styles.inputContainer}
      />
      
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Workouts</Text>
      </View>
      
      <LegendList
        data={workouts}
        estimatedItemSize={200}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.exerciseContainer}>
            <View style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{item.workout.name}</Text>
              <Text style={styles.muscleGroup}>
                {item.workout.muscle_group.name} • {item.workout.exercise_type}
              </Text>
            </View>
            
            <View style={styles.editControls}>
              <View style={styles.modeToggleContainer}>
                <Text style={styles.editLabel}>Mode:</Text>
                <TouchableOpacity 
                  style={styles.modeToggle}
                  onPress={() => toggleWorkoutMode(item.id)}
                >
                  <Text style={styles.modeText}>
                    {item.workout_mode === 'reps_sets' ? 'Sets & Reps' : 
                     item.workout_mode === 'timer' ? 'Timer' : 'Duration'}
                  </Text>
                </TouchableOpacity>
              </View>

              {renderWorkoutModeControls(item)}
              
              {item.workout_mode === 'reps_sets' && (
                <View style={styles.editItem}>
                  <Text style={styles.editLabel}>Rest (seconds):</Text>
                  <TextInput
                    style={styles.editInput}
                    keyboardType="numeric"
                    value={item.rest_between_sets === null ? '' : item.rest_between_sets.toString()}
                    onChangeText={(value) => 
                      handleNumericInputChange(value, item.id, 'rest_between_sets')
                    }
                    placeholder="60"
                  />
                </View>
              )}
              
              <View style={styles.notesContainer}>
                <Text style={styles.editLabel}>Notes:</Text>
                <TextInput
                  style={styles.notesInput}
                  value={item.notes}
                  onChangeText={(value) => updateWorkoutValue(item.id, 'notes', value)}
                  placeholder="Add notes for this workout..."
                  multiline
                />
              </View>
            </View>
          </View>
        )}
        recycleItems
        maintainVisibleContentPosition={true}
        contentContainerStyle={styles.workoutsContainer}
        ListEmptyComponent={() =>
          loading ? (
            <Text style={styles.emptyText}>Loading workouts...</Text>
          ) : (
            <Text style={styles.emptyText}>No workouts found in this routine.</Text>
          )
        }
      />
      
      <View style={styles.continue}>
        <DefButton 
          text={saving ? "Saving..." : "Save Changes"} 
          onPress={handleSaveRoutine} 
        />
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20
  },
  title: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 32,
    color: "#6E49EB",
    fontWeight: '600',
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 10
  },
  workoutsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 100
  },
  exerciseContainer: {
    marginBottom: 15,
    marginHorizontal: 10,
  },
  exerciseItem: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  muscleGroup: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 20
  },
  editControls: {
    backgroundColor: '#f7f5ff',
    borderRadius: 10,
    marginTop: 5,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0d8ff'
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeToggle: {
    backgroundColor: '#6E49EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  modeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  editItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  editLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#6E49EB',
    fontWeight: '500',
  },
  editInput: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0d8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 70,
    textAlign: 'center'
  },
  notesContainer: {
    marginTop: 10,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0d8ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 5,
    minHeight: 40,
  },
  continue: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    margin: 20,
  },
});

export default EditRoutine;