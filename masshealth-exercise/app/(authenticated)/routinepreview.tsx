import { router, Stack } from 'expo-router';
import { useLocalSearchParams, useSearchParams } from 'expo-router/build/hooks';
import ExerciseinRoutine from '../../components/ExerciseinRoutine'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset
} from 'react-native-reanimated';
import DefButton from '../../components/DefButton';
import BackIcon from '../../assets/tsxicons/backicon';
import DeleteIcon from '../../assets/tsxicons/deleteicon';
import EditIcon from '../../assets/tsxicons/editicon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import privateApi from '@/api';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';


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
    timer_duration: number | null; // in seconds
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

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 400;

const routinepreview = () => {
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollOffset = useScrollViewOffset(scrollRef);

    const { routineName, routineId } = useLocalSearchParams<{
        routineName: string;
        routineId: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [routine, setRoutine] = useState<RoutineDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [startingWorkout, setStartingWorkout] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchRoutineDetails = async () => {
        if (!routineId) {
          setError('No routine ID provided');
          setLoading(false);
          return;
        }
      
        try {
          setLoading(true);
          
          // Always fetch by ID - this is more reliable than name matching
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
      };

      useFocusEffect(
        React.useCallback(() => {
          fetchRoutineDetails();
        }, [routineId, routineName])
      );

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
          transform: [
            {
              translateY: interpolate(
                scrollOffset.value,
                [-IMG_HEIGHT, 0, IMG_HEIGHT],
                [-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
              )
            },
            {
              scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1])
            }
          ]
        };
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
          opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT / 1.5], [0, 1])
        };
    });

    const formatSetsReps = (exercise: RoutineWorkout) => {
        if (exercise.workout_mode == 'reps_sets' && exercise.custom_reps !== null && exercise.custom_sets !== null ) {
            return `${exercise.custom_sets} x ${exercise.custom_reps}`
        } else if (exercise.workout_mode == 'timer' && exercise.effective_duration !== null) {
            return `${exercise.effective_duration}`
        } else if (exercise.workout_mode == 'duration' && exercise.duration_minutes !== null) {
            return  `${exercise.duration_minutes}`
        } else {
            return ''
        }
    };

    const parseVideoData = (videoData: any) => {
        if (!videoData) return null;
        
        try {
          // If it's already a string (URL), return it
          if (typeof videoData === 'string') {
            return videoData;
          }
          
          // If it's an object with url property
          if (videoData.url) {
            return videoData.url;
          }
          
          // If it's a JSON string, parse it
          if (typeof videoData === 'string') {
            const parsed = JSON.parse(videoData);
            return parsed.url || parsed;
          }
          
          return videoData;
        } catch (error) {
          console.log('Error parsing video data:', error);
          return videoData;
        }
    };

    const handleDeleteRoutine = async () => {
        if (!routine) return;

        Alert.alert(
          "Delete Routine",
          `Are you sure you want to delete "${routine.name}"? This action cannot be undone.`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                setDeleting(true);
                try {
                  await privateApi.delete(`/api/auth/routines/${routine.id}/delete/`);
                  router.back();
                } catch (error) {
                  console.error('Error deleting routine:', error);
                  Alert.alert('Error', 'Failed to delete routine. Please try again.');
                } finally {
                  setDeleting(false);
                }
              }
            }
          ]
        );
    };

    const startWorkout = () => {
        setStartingWorkout(true);
        // Navigate to workout session or implement workout logic
        console.log("Starting workout for routine:", routine?.name);
        // router.push(`/workout-session?routineId=${routine?.id}`);
        setStartingWorkout(false);
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.topButtonRow}>
                    <View style={styles.backButtonContainer}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <BackIcon stroke={'white'} width={24} height={24} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.noExercisesText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    headerLeft: () => <Text>Back</Text>,
                    headerBackground: () => <Animated.View style={[styles.header, headerAnimatedStyle]} />,
                }}
            />
            <View style={{ flex: 1 }}>
                <View style={styles.topButtonRow}>
                    <View style={styles.backButtonContainer}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <BackIcon stroke={'white'} width={24} height={24} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.editDeleteButtonContainer}>
                        <TouchableOpacity onPress={handleDeleteRoutine} disabled={deleting}>
                            <DeleteIcon stroke={'white'} width={24} height={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push(`/editroutine?routineId=${routineId}`)}>
                            <EditIcon stroke={'white'} width={24} height={24} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <Animated.ScrollView
                    ref={scrollRef}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 100 }} 
                >
                    <Animated.Image
                        source={require('../../assets/backgroundForView.png')}
                        style={[styles.image, imageAnimatedStyle]}
                    />
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text style={styles.title}>
                            {routine?.name || routineName}
                        </Text>
                        
                        {routine?.description && (
                            <Text style={styles.description}>
                                {routine.description}
                            </Text>
                        )}
                        
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#6E49EB" />
                                <Text style={styles.loadingText}>Loading exercises...</Text>
                            </View>
                        ) : routine?.workouts && routine.workouts.length > 0 ? (
                            // Map through routine exercises and render each one
                            routine.workouts.map((exerciseItem) => {
                                const parsedVideo = parseVideoData(exerciseItem.workout.video_url);
                                
                                return (
                                  <ExerciseinRoutine 
                                        key={exerciseItem.id}
                                        video={parsedVideo}
                                        exerciseName={exerciseItem.workout.name}
                                        reps={formatSetsReps(exerciseItem)}
                                        press={false}
                                        isSelected={false}
                                        onPress={() => {
                                            const videoUrl = parseVideoData(exerciseItem.workout.video_url);

                                            router.push({
                                                pathname: '/exercisedescription',
                                                params: {
                                                    exerciseName: exerciseItem.workout.name,
                                                    videoUrl: typeof videoUrl === 'string' ? videoUrl : JSON.stringify(videoUrl),
                                                }
                                            });
                                        } }
                                        destination="/exercisedescription"
                                        loading={false} overview={''}                                  />
                                );
                              })
                        ) : (
                            <Text style={styles.noExercisesText}>
                                No exercises found in this routine
                            </Text>
                        )}
                    </View>
                </Animated.ScrollView>

                <View style={styles.continue}>
                    <DefButton 
                        text={startingWorkout ? "Starting..." : "Start Workout"} 
                        onPress={startWorkout} 
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default routinepreview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  image: {
    width: width,
    height: IMG_HEIGHT
  },
  header: {
    backgroundColor: '#fff',
    height: 100,
    borderWidth: StyleSheet.hairlineWidth
  },
  backButtonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 20,
    padding: 10,
    position: 'absolute',
    top: 30, 
    left: 20,
    zIndex: 20,
  },
  editDeleteButtonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 20,
    padding: 10,
    position: 'absolute',
    top: 30, 
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: "#6E49EB",
    paddingHorizontal: 20
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 20,
    lineHeight: 22
  },
  continue: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  topButtonRow: {
    flexDirection: 'row'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  noExercisesText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
    fontSize: 16
  }
});