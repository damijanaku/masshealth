import { View, Text, StyleSheet, Pressable } from 'react-native'
import React, { useState } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import DefButton from '@/components/DefButton'

const preferencesScreen = () => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const goals = [
    { id: 'weight-loss', label: '💪Loosing weight' },
    { id: 'cardio', label: '👟Cardio' },
    { id: 'maintaining', label: '🕺️Maintaining weight' },
    { id: 'weightlifting', label: '🏋️‍♂️Weightlifting' },
    { id: 'sixpack', label: '🍻 Getting sixpack' },
    { id: 'active', label: '🔋Staying active' },
  ]

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const isSelected = (goalId: string) => selectedGoals.includes(goalId)

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
          onPress={() => router.push('/(authenticated)/injuriesEnter')}
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