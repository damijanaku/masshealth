import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import privateApi, { publicApi } from '@/api'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackIcon from '@/assets/tsxicons/backicon'
import { router } from 'expo-router'
import Input from '@/components/Input'
import TagButton from '@/components/Tag'
import { LegendList } from '@legendapp/list'
import ExerciseinRoutine from '@/components/ExerciseinRoutine'
import DefButton from '@/components/DefButton'

interface Muscle {
  id: number;
  name: string;
  created_at?: string;
}

type Exercise = {
  video_url: JSON
  secondary_muscles: string
  video: Record<string, any>;
  id: number;
  name: string;
  equipment_id?: number;
  experience_level_id?: number;
  mechanics_type_id?: number;
  force_type_id?: number;
  exercise_type_id?: number;
  description?: string;
  instructions?: string;
  tips?: string;
};

type SelectedExercise = {
  id: number;
  name: string;
  video_urls: Record<string, any>;
  overview: string;
  sets: number;
  reps: number;
  isSelected: boolean;
};

const CreateRoutine = () => {
    const [loading, setLoading] = useState(true)
    const [routineName, setRoutineName] = useState("")
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null); // Changed to string for muscle name
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loadingExerciseId, setLoadingExerciseId] = useState<number | null>(null);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [muscles, setMuscles] = useState<Muscle[]>([]);
    const [savingRoutine, setSavingRoutine] = useState(false);
    const [selectedCount, setSelectedCount] = useState(0); 
    const [customAlertVisible, setCustomAlertVisible] = useState(false);
    const [customAlertMessage, setCustomAlertMessage] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])

    const formatSetsReps = (exercise: Exercise) => {
      const selectedExercise = selectedExercises.find(e => e.id === exercise.id);
      if (selectedExercise) {
        return `${selectedExercise.sets}×${selectedExercise.reps}`;
      }
      return "Add"; 
    };

    const isExerciseSelected = (exerciseId: number): boolean => {
      return selectedExercises.some(ex => ex.id === exerciseId);
    };

    const fetchMuscles = async () => {
        try {
            setLoading(true);
            const response = await publicApi.get('/api/auth/muscle-groups/');

            if(response.data.success) {
                setMuscles(response.data.data || [])
            }
        } catch (error) {
            console.error("Error fetching muscles:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchExercises = async (muscleName: string) => {
        try {
            setLoadingExercises(true)
            // Search exercises by muscle group name instead of ID
            const response = await privateApi.get(`api/auth/workouts/muscle-group/${muscleName}`)

            setExercises(response.data || [])
            console.log("fetched")
        } catch (error) {
            console.error("Error fetching exercises:", error)
        } finally {
            setLoadingExercises(false)
        }
    }

    const toggleExerciseSelection = async (exercise: Exercise) => {
        setLoadingExerciseId(exercise.id);
        
        try {
            const isSelected = isExerciseSelected(exercise.id);
            
            if (isSelected) {
                // Remove exercise from selected list
                setSelectedExercises(prev => prev.filter(ex => ex.id !== exercise.id));
                setSelectedCount(prev => prev - 1);
            } else {
                // Add exercise to selected list with default values
                const newSelectedExercise: SelectedExercise = {
                    id: exercise.id,
                    name: exercise.name,
                    video_urls: { url: exercise.video_url },
                    overview: exercise.secondary_muscles || '', 
                    sets: 3,
                    reps: 10,
                    isSelected: true
                };
                setSelectedExercises(prev => [...prev, newSelectedExercise]);
                setSelectedCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error toggling exercise:", error)
        } finally {
            setLoadingExerciseId(null);
        }
    };

    const handleTagPress = async (muscleName: string) => {
        if (selectedMuscle === muscleName) {
            setSelectedMuscle(null);
            setExercises([]);
            return;
        } 

        muscleName = muscleName.toLowerCase()
    
        setSelectedMuscle(muscleName);
        setExercises([]);
        
        // Fetch exercises by muscle group name
        fetchExercises(muscleName);
    };

    useEffect(() => {
        fetchMuscles();
    }, [])

    const saveRoutine = async () => {
      console.log(`Selected exercises count: ${selectedExercises.length}`);
      
      if(!routineName){
        setCustomAlertMessage('Please enter a routine name');
        setCustomAlertVisible(true);
        return;
      }
    
      if(selectedExercises.length === 0) {
        setCustomAlertMessage('Please select at least one exercise');
        setCustomAlertVisible(true);
      }
    
      try {
        setLoadingExercises(true);

        const workoutData = selectedExercises.map((exercise, index) => ({
          workout_id : exercise.id,
          rest_between_sets: 60,
          notes: ''
        }))

        const routinePayload = {
          name: routineName.trim(),
          description: '',
          is_public: false,
          workouts: workoutData
        }

        console.log('Sending routine data:', routinePayload);

        const response = await privateApi.post(
          '/api/auth/routines/create-with-workouts/', 
          routinePayload
        );

        console.log('Routine created successfully:', response.data);

        setCustomAlertMessage('Routine created successfully!');
        setCustomAlertVisible(true);

        setTimeout(() => {
          setCustomAlertVisible(false);
          router.back(); 
        }, 2000);
      } catch (error) {
        console.error('Error creating routine:', error);

      } finally {
        setSavingRoutine(false);
      }
    };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.title}>
        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => router.back()}>
                <BackIcon stroke={"#6E49EB"} height={24} width={24}/>
            </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.text}>Create a routine</Text>
        </View>
      </View>

      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Routine name</Text>
      </View>
      <Input
        value={routineName}
        onChangeText={setRoutineName}
        style={styles.inputContainer}
        placeholder="Enter routine name"
      />
      <View style={styles.tagListContainer}>
        {loading ? (
          <Text>Loading muscle groups...</Text>
        ) : (
          <FlatList
            data={muscles}
            numColumns={3}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TagButton 
                onPress={() => handleTagPress(item.name)} // Pass muscle name instead of ID
                text={item.name}
                textSize='14'
              />
            )}
            contentContainerStyle={styles.tagListContent}
            columnWrapperStyle={styles.tagColumnWrapper}
          />
        )}
      </View>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Workouts {selectedExercises.length > 0 ? `(${selectedExercises.length} selected)` : ''}
        </Text>
      </View>
    
      <LegendList
        data={exercises}
        estimatedItemSize={80}
        extraData={[selectedCount, selectedExercises]} 
        renderItem={({ item }) => (
          <ExerciseinRoutine
            exerciseName={item.name}
            overview={item.secondary_muscles ?? ''}
            video={item.video_url}
            reps={formatSetsReps(item)}
            press={true}
            isSelected={isExerciseSelected(item.id)}
            onPress={() => toggleExerciseSelection(item)}
            loading={loadingExerciseId === item.id} 
          />
        )}
        recycleItems
        maintainVisibleContentPosition={true}
        contentContainerStyle={styles.workoutsContainer}
        ListEmptyComponent={
          () =>
            loadingExercises ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : selectedMuscle ? (
              <Text style={styles.emptyText}>No exercises found for {selectedMuscle}.</Text>
            ) : (
              <Text style={styles.emptyText}>Select a muscle group to see exercises.</Text>
            )
        }
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Selected exercises: {selectedExercises.length}
        </Text>
      </View>
      <View style={styles.continue}>
        <DefButton 
          text={savingRoutine ? "Creating..." : "Create Routine"} 
          onPress={saveRoutine}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container : {
        flex: 1,
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20
    },
    title : {
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
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 20
      },
      subtitle: {
        fontSize: 16,
        fontWeight: '600'
      },
      inputContainer: {
        marginHorizontal: 20
      },
      tagListContainer: {
        marginHorizontal: 15,
        marginVertical: 10,
        height: 120, 
      },
      tagListContent: {
        paddingVertical: 5,
      },
      tagColumnWrapper: {
        justifyContent: 'center',
        marginBottom: 5,
      },
      workoutsContainer: {
        padding: 10,
        paddingBottom: 100,
      },
      statusBar: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        padding: 5,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
      },
      statusText: {
        fontSize: 12,
        color: '#666',
      },
      continue: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
      },
      emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
      }
})

export default CreateRoutine