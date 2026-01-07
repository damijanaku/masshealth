import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import DefButton from '@/components/DefButton'
import { router } from 'expo-router'
import privateApi from '@/api'

const injuriesEnter = () => {
  const [selectedInjuries, setSelectedInjuries] = useState<number[]>([])
  const [injuries, setInjuries] = useState<{ id: number; label: string }[]>([])

  const getInjuries = async () => {
    try {
      const response = await privateApi.get('/api/auth/conditions-injuries/');

      if (response.data.success) {
        setInjuries(response.data.conditions.map((condition: any) => ({
          id: condition.id, 
          label: condition.label,
        })));
      }
    } catch (error) {
      console.error('Error fetching injuries:', error);
    }
  }

  const setMyInjuries = async () => {
    try {
      await privateApi.post('/api/auth/profile/conditions-injuries/add/', {
        conditions: selectedInjuries 
      });
    } catch (error) {
      console.error('Error setting injuries:', error);
    }
  }

  const toggleInjury = (injuryId: number) => {
    setSelectedInjuries(prev => 
      prev.includes(injuryId) 
        ? prev.filter(id => id !== injuryId)
        : [...prev, injuryId]
    )
  }

  const isSelected = (injuryId: number) => selectedInjuries.includes(injuryId)
  
  useEffect(() => {
    getInjuries();
  }, [])

  const generateRecommendations = async () => {
    try {
      const response = await privateApi.post('/api/auth/profile/recommendations/');
      if (response.data.success) {
        console.log('Recommendations generated successfully');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitleText}>Enter injuries/conditions (if you have them)?</Text>
        <Text style={styles.subtitleText}>This helps us create personalized workouts for you</Text>
        <View style={styles.buttonGroup}>
          {injuries.map(injury => (
            <Pressable
              key={injury.id}
              style={[
                styles.button,
                isSelected(injury.id) && styles.buttonSelected
              ]}
              onPress={() => toggleInjury(injury.id)}
            >
              <Text style={[
                styles.buttonText,
                isSelected(injury.id) && styles.buttonTextSelected
              ]}>
                {injury.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.continueButton}>
        <DefButton 
          text={"Continue"} 
          onPress={async () => {
            await setMyInjuries();
            await generateRecommendations();
            router.push('/(authenticated)/(tabs)/home');
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
    marginHorizontal: 21
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
})

export default injuriesEnter