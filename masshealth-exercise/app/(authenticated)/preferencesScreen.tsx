import { View, Text, StyleSheet, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import DefButton from '@/components/DefButton'
import privateApi from '@/api'

const preferencesScreen = () => {
  const [goals, setGoals] = useState<{ id: number; label: string }[]>([])
  const [selectedGoals, setSelectedGoals] = useState<number[]>([])

  const getGoals = async () => {
    try {
      const response = await privateApi.get('/api/auth/fitness-goals/');

      if (response.data.success) {
        setGoals(response.data.goals.map((goal: any) => ({
          id: goal.id,
          label: goal.label,
        })));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  }

  const setMyGoals = async () => {
    try {
      await privateApi.post('/api/auth/profile/fitness-goals/add/', {
        goals: selectedGoals 
      });
    } catch (error) {
      console.error('Error setting goals:', error);
    }
  }

  const toggleGoal = (goalId: number) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const isSelected = (goalId: number) => selectedGoals.includes(goalId)

  useEffect(() => {
    getGoals();
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitleText}>What are your current fitness goals?</Text>
        <Text style={styles.subtitleText}>Choose between 3 or more topics that apply to you</Text>
        <View style={styles.buttonGroup}>
          {goals.map(goal => (
            <Pressable
              key={goal.id}
              style={[
                styles.button,
                isSelected(goal.id) && styles.buttonSelected
              ]}
              onPress={() => toggleGoal(goal.id)}
            >
              <Text style={[
                styles.buttonText,
                isSelected(goal.id) && styles.buttonTextSelected
              ]}>
                {goal.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.continueButton}>
        <DefButton 
          text={"Continue"} 
          onPress={async () => {
            await setMyGoals();
            router.push('/(authenticated)/injuriesEnter');
          }}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#000000',
    margin: 20
  },
  subtitleText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#808080',
    marginHorizontal: 20
  },
  buttonGroup: {
    marginHorizontal: 5,
    marginVertical: 10,
    padding: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#808080'
  },
  buttonSelected: {
    backgroundColor: '#6E49EB',
    borderColor: '#6E49EB'
  },
  buttonText: {
    fontSize: 12,
  },
  buttonTextSelected: {
    fontSize: 12,
    color: '#FFFFFF'
  },
  continueButton: {
    margin: 10,
    paddingBottom: 20
  }
});

export default preferencesScreen;