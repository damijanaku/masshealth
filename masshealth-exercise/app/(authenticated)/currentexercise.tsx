import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SwipeListView } from 'react-native-swipe-list-view';
import LegIcon from '../../assets/tsxicons/legicon';
import PlayIcon from '../../assets/tsxicons/playicon';
import TimerIcon from '../../assets/tsxicons/timericon';
import DoneIcon from '../../assets/tsxicons/doneicon';
import { router } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import privateApi from '@/api';

type Exercise = {
  key: string;
  excercise_id: number;
  exerciseName: string;
  description?: string;
  videoUrls?: any;
  reps: string;
  playWorkout: boolean;
  doneWorkout: boolean;
  is_set_type: boolean;
  is_timer_type: boolean;
  num_of_sets: number;
  num_of_reps: number;
  time_held: number | null;
  current_time: number | null; // For timer countdown
  remaining_sets: number;
  total_sets: number;
  workout_mode: 'reps_sets' | 'timer' | 'duration';
};

type CurrentExerciseListProps = {
  routineId?: number | null;
  routineName?: string;
};

const CurrentExerciseList = ({ routineId, routineName }: CurrentExerciseListProps) => {
  const [listData, setListData] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTimerIndex, setActiveTimerIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (routineId) {
      fetchExercisesForRoutine(routineId);
    } else {
      setListData([]);
    }
  }, [routineId]);

  // Timer effect for countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (activeTimerIndex !== null) {
      const exercise = listData[activeTimerIndex];
      
      if (exercise && exercise.playWorkout && exercise.is_timer_type && exercise.current_time !== null && exercise.current_time > 0) {
        timer = setInterval(() => {
          setListData(prevData => {
            const updatedData = [...prevData];
            const currentExercise = updatedData[activeTimerIndex];
            
            if (currentExercise.current_time !== null && currentExercise.current_time > 0) {
              currentExercise.current_time -= 1;
              currentExercise.reps = `${currentExercise.current_time}s`;
              
              // Timer completed
              if (currentExercise.current_time === 0) {
                currentExercise.playWorkout = false;
                currentExercise.doneWorkout = true;
                currentExercise.reps = "Completed";
                setActiveTimerIndex(null);
                
                // Check if all exercises are done
                setTimeout(() => {
                  const allDone = updatedData.every(item => item.doneWorkout);
                  if (allDone && routineName) {
                    console.log('All exercises completed!');
                  }
                }, 100);
              }
            }
            
            return updatedData;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTimerIndex, listData]);

  const formatSetsReps = (exercise: Exercise) => {
    if (exercise.is_set_type) {
      return `${exercise.remaining_sets}×${exercise.num_of_reps}`;
    } else if (exercise.is_timer_type) {
      return exercise.current_time !== null ? `${exercise.current_time}s` : "Hold";
    }
    return "Hold";
  };

  const fetchExercisesForRoutine = async (routineId: number) => {
    try {
      setLoading(true);
      const response = await privateApi.get(`/api/auth/routines/${routineId}/`);
      
      if (response.data && response.data.workouts) {
        const workouts = response.data.workouts;
        
        const exercises: Exercise[] = workouts.map((workout: any, index: number) => {
          const isSetType = workout.workout_mode === 'reps_sets';
          const isTimerType = workout.workout_mode === 'timer';
          const totalSets = workout.custom_sets || workout.effective_sets || 0;
          const timerDuration = workout.timer_duration || workout.effective_duration || 0;
          
          return {
            key: `exercise-${workout.id}-${index}`,
            excercise_id: workout.workout.id,
            exerciseName: workout.workout.name,
            description: workout.notes,
            videoUrls: workout.workout.video_url,
            reps: isSetType ? `${totalSets}×${workout.custom_reps || workout.effective_reps}` : 
                   isTimerType ? `${timerDuration}s` : 'Hold',
            playWorkout: false,
            doneWorkout: false,
            is_set_type: isSetType,
            is_timer_type: isTimerType,
            num_of_sets: totalSets,
            num_of_reps: workout.custom_reps || workout.effective_reps || 0,
            time_held: isTimerType ? timerDuration : null,
            current_time: isTimerType ? timerDuration : null,
            remaining_sets: totalSets,
            total_sets: totalSets,
            workout_mode: workout.workout_mode
          };
        });
        
        setListData(exercises);
      }
    } catch (error) {
      console.error('Error fetching exercises for routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayWorkout = (index: number) => {
    setListData((prevData) => {
      const currentItem = prevData[index];
      
      if (currentItem.doneWorkout) {
        return prevData;
      }
      
      // For timer exercises - start the countdown
      if (currentItem.is_timer_type && !currentItem.playWorkout) {
        const updatedData = prevData.map((item, i) =>
          i === index ? { 
            ...item, 
            playWorkout: true,
            current_time: item.time_held // Start the timer
          } : item
        );
        
        setActiveTimerIndex(index);
        return updatedData;
      }
      
      // For sets/reps exercises - handle click progression
      if (currentItem.is_set_type) {
        if (!currentItem.playWorkout) {
          // Start the set
          return prevData.map((item, i) =>
            i === index ? { ...item, playWorkout: true } : item
          );
        }
        
        // Complete one set
        if (currentItem.remaining_sets > 1) {
          return prevData.map((item, i) =>
            i === index ? { 
              ...item, 
              remaining_sets: item.remaining_sets - 1,
              reps: formatSetsReps({...item, remaining_sets: item.remaining_sets - 1})
            } : item
          );
        } 
        // Complete the last set
        else if (currentItem.remaining_sets === 1) {
          const updatedData = prevData.map((item, i) =>
            i === index ? { 
              ...item, 
              playWorkout: false,
              doneWorkout: true,
              remaining_sets: 0,
              reps: "Completed"
            } : item
          );
          
          setTimeout(async () => {
            const allDone = updatedData.every(item => item.doneWorkout);
            if (allDone && routineName) {
              console.log('All exercises completed!');
            }
          }, 100);
          
          return updatedData;
        }
      }
      
      return prevData;
    });
  };

  const markWorkoutAsDone = async (index: number) => {
    try {
      setListData((prevData) => {
        const updatedData = prevData.map((item, i) =>
          i === index ? { 
            ...item, 
            doneWorkout: true, 
            playWorkout: false,
            remaining_sets: 0,
            current_time: 0,
            reps: "Completed"
          } : item
        );
        
        // Stop timer if this was the active timer
        if (activeTimerIndex === index) {
          setActiveTimerIndex(null);
        }
        
        const completedCount = updatedData.filter(ex => ex.doneWorkout).length;
        const totalExercises = updatedData.length;
        
        console.log(`Workout progress: ${completedCount}/${totalExercises}`);
        
        const allExercisesDone = completedCount === totalExercises;
        
        if (allExercisesDone && routineName) {
          console.log('All exercises completed!');
        }
        
        return updatedData;
      });
    } catch (error) {
      console.error('Error marking workout as done:', error);
    }
  };

  const resetWorkout = (index: number) => {
    setListData((prevData) => {
      const item = prevData[index];
      const resetData = prevData.map((item, i) =>
        i === index ? { 
          ...item, 
          doneWorkout: false, 
          playWorkout: false,
          remaining_sets: item.total_sets,
          current_time: item.time_held,
          reps: formatSetsReps({...item, remaining_sets: item.total_sets, current_time: item.time_held})
        } : item
      );
      
      // Stop timer if this was the active timer
      if (activeTimerIndex === index) {
        setActiveTimerIndex(null);
      }
      
      return resetData;
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  if (!routineId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Select a workout to see exercises</Text>
      </View>
    );
  }

  return (
    <SwipeListView
      data={listData}
      renderItem={({ item, index }) => (
        <ExerciseRow
          item={item}
          index={index}
          togglePlayWorkout={togglePlayWorkout}
          markWorkoutAsDone={markWorkoutAsDone}
          isTimerActive={activeTimerIndex === index && item.playWorkout}
        />
      )}
      renderHiddenItem={({ item, index }) => (
        <View style={styles.rowBack}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              router.push({
                pathname: "/exercisedescription",
                params: {
                  exerciseName: item.exerciseName,
                  description: item.description,
                  videoUrl: typeof item.videoUrls === 'string' ? item.videoUrls : JSON.stringify(item.videoUrls),
                }
              });
            }}
          >
            <Text style={styles.actionText}>Preview</Text>
          </TouchableOpacity>
                    
          <View style={styles.rightButtons}>
            {(item.playWorkout || item.doneWorkout) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => resetWorkout(index)}
              >
                <Text style={styles.actionText}>Reset</Text>
              </TouchableOpacity>
            )}
            {item.playWorkout && item.is_set_type && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => markWorkoutAsDone(index)}
              >
                <Text style={styles.actionText}>Complete Set</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      rightOpenValue={-180}
      leftOpenValue={120}
      disableRightSwipe={false}
    />
  );
};

const ExerciseRow = ({
  item,
  index,
  togglePlayWorkout,
  markWorkoutAsDone,
  isTimerActive,
}: {
  item: Exercise;
  index: number;
  togglePlayWorkout: (index: number) => void;
  markWorkoutAsDone: (index: number) => void;
  isTimerActive: boolean;
}) => {
  const calculateProgress = () => {
    if (item.doneWorkout) return 100;
    
    if (item.is_set_type) {
      if (item.total_sets === 0) return 0;
      const setsCompleted = item.total_sets - item.remaining_sets;
      return (setsCompleted / item.total_sets) * 100;
    }
    
    if (item.is_timer_type && item.time_held) {
      const timeElapsed = (item.time_held - (item.current_time || 0));
      return (timeElapsed / item.time_held) * 100;
    }
    
    return 0;
  };

  const getButtonIcon = () => {
    if (item.doneWorkout) {
      return <DoneIcon strokeColor="white" width={32} height={32} />;
    }
    
    if (item.is_timer_type && item.playWorkout) {
      return <TimerIcon strokeColor="white" width={32} height={32} />;
    }
    
    if (item.is_set_type && item.playWorkout) {
      return <Text style={styles.completeSetText}>✓</Text>;
    }
    
    return <PlayIcon strokeColor="white" width={32} height={32} />;
  };

  const getButtonAction = () => {
    if (item.doneWorkout) return null;
    
    if (item.is_timer_type) {
      return () => togglePlayWorkout(index);
    }
        
    return () => togglePlayWorkout(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerStyle}>
        <View style={styles.circle}>
          <AnimatedCircularProgress
            size={62}
            width={2}
            fill={calculateProgress()}
            tintColor={item.doneWorkout ? "#4CAF50" : "#6E49EB"}
            backgroundColor="#E0E0E0"
            rotation={0}
            duration={500}
          >
            {() => (
              <LegIcon 
                width={32} 
                height={32} 
                strokeColor={item.doneWorkout ? "#4CAF50" : "#6E49EB"} 
              />
            )}
          </AnimatedCircularProgress>
        </View>
        <View style={styles.textContainer}>
          <Text numberOfLines={2} style={styles.exerciseName}>{item.exerciseName}</Text>
          <Text style={[
            styles.repsText, 
            item.doneWorkout ? styles.completedText : {},
            isTimerActive ? styles.timerActiveText : {}
          ]}>
            {item.reps}
            {isTimerActive && ' ⏱️'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.buttonContainer,
          item.doneWorkout ? styles.doneButtonContainer : {},
          item.playWorkout ? styles.activeButtonContainer : {}
        ]}
        onPress={getButtonAction() || undefined}
        disabled={item.doneWorkout || (item.is_timer_type && item.playWorkout)}
      >
        {getButtonIcon()}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: "white",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 16,
    color: 'black',
    flexWrap: 'wrap',
  },
  repsText: {
    fontSize: 16,
    color: '#A4A4A8',
  },
  completedText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  timerActiveText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  buttonContainer: {
    backgroundColor: '#6E49EB',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButtonContainer: {
    backgroundColor: '#FF6B35',
  },
  doneButtonContainer: {
    backgroundColor: '#4CAF50',
  },
  completeSetText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 20,
  },
  doneButton: {
    backgroundColor: '#6E49EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#6E49EB', 
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    margin: 10,
  },
  previewButton: {
    backgroundColor: '#6E49EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
  },
});

export default CurrentExerciseList;