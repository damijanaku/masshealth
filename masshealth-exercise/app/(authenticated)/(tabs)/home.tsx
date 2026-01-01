import { View, Text, SafeAreaView, StyleSheet, Image, Dimensions, ScrollView, Platform, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import HomeIcon from '../../../assets/tsxicons/homenavbaricon';
import FireIcon from '../../../assets/tsxicons/fireicon';
import SleepIcon from '../../../assets/tsxicons/sleepicon';
import CustomDate from '../../../components/Date';
import CustomAlert from '../../../components/CustomAlert';  
//import useHealthDataios from '../../../hooks/useHealthDataios'
//import useHealthData from '../../../hooks/useHealthData'
//EXPO GO USERS!! zakomentiraj hooks in rocno nastavi steps, flights, distance
import privateApi, { publicApi } from '../../../api';
import { useUser } from '@/hooks/useUser';
import ChallengePopUp from '../../../components/challengePopUp';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, AuthorizationStatus } from '@react-native-firebase/messaging';

const width = Dimensions.get('window').width;
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const home = () => {
  const { user, logout } = useUser();
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [image, setImage] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [challengePopUpVisible, setChallengePopUpVisible] = useState(false);

  // Use selectedDate instead of the fixed date
  //const androidHealthData = useHealthData(selectedDate);
  //const iosHealthData = useHealthDataios(selectedDate)
  
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Monday = 0, Sunday = 6
  
  // Create week dates
  const weekDates = dayNames.map((_, index) => {
    const date = new Date();
    date.setDate(today.getDate() - todayIndex + index);
    // Set time to start of day 
    date.setHours(0, 0, 0, 0);
    
    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);
    
    return {
      day: dayNames[index],
      dayOfMonth: date.getDate(),
      fullDate: date,
      isToday: date.getTime() === new Date().setHours(0, 0, 0, 0),
      isSelected: date.getTime() === selectedDateNormalized.getTime(),
    };
  });

  // Handler for date selection
  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  let sleep = 0;
  let calories = 0;

  if (Platform.OS === 'ios') {
      //When you have iOS hook ready, use it here
      //sleep = iosHealthData.sleepingHours;
      //calories = iosHealthData.calories;
  } else if (Platform.OS === 'android') {
      //steps = androidHealthData.steps;
      //flights = androidHealthData.flights;
      //distance = androidHealthData.distance;
      sleep = 0;
      calories = 0;
  }

  async function requestUserPermission() {
    if (Platform.OS === 'ios') {
      const app = getApp();
      const messaging = getMessaging(app);
      
      const authStatus = await messaging.requestPermission();
      const enabled = 
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
  
      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
      
      return enabled;
    }
    
    return true;
  }

  const saveTokenToBackend = async (token: string) => {
    try {
      const response = await privateApi.post('api/auth/notifications/token/', {
        token: token,
        device_type: Platform.OS, 
      });
      
      console.log('Token saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  };

  const getToken = async () => {
    try {
      const app = getApp();
      const messaging = getMessaging(app);
      const token = await messaging.getToken();
      console.log("Token:", token);
      
      // Save token to backend
      if (token) {
        await saveTokenToBackend(token);
      }
      
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
    }
  }

  const getChallenge = async () => {
    try {
      const response = await privateApi.get('api/auth/challenges/pending/');
      console.log('Pending challenges:', response.data);
      
      const fetchedChallenges = response.data.challenges;
      
      if (fetchedChallenges && fetchedChallenges.length > 0) {
        setChallenges(fetchedChallenges);
        setChallengePopUpVisible(true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
    }
  }

  const handleAcceptChallenge = async (challengeId: number) => {
    try {
      const response = await privateApi.post(`api/auth/challenge/${challengeId}/accept/`);
      console.log(`Challenge ${challengeId} accepted:`, response.data);
      
      // Remove accepted challenge from list
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      // Close popup if no more challenges
      if (challenges.length === 1) {
        setChallengePopUpVisible(false);
      }
      
      } catch (error) {
        console.error('Error accepting challenge:', error);
        setCustomAlertMessage('Failed to accept challenge');
        setCustomAlertVisible(true);
      }
  };
  
  const handleDeclineChallenge = async (challengeId: number) => {
    try {
      const response = await privateApi.post(`api/auth/challenge/${challengeId}/decline/`);
      console.log(`Challenge ${challengeId} declined:`, response.data);
      
      // Remove declined challenge from list
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      // Close popup if no more challenges
      if (challenges.length === 1) {
        setChallengePopUpVisible(false);
      }
      
      setCustomAlertMessage('Challenge declined');
      setCustomAlertVisible(true);
    } catch (error) {
      console.error('Error declining challenge:', error);
      setCustomAlertMessage('Failed to decline challenge');
      setCustomAlertVisible(true);
    }
  };


  useEffect(() => {
    requestUserPermission();
    getToken();
    getChallenge();
  }, [])


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.sectionTitle}>
          <HomeIcon color={'#6E49EB'} fill={'white'} />
          <Text style={styles.sectionTitleText}>Home</Text>
        </View>
        <View style={styles.upperRow}>
          <View style={styles.user}>
            <Text style={styles.userText}>Hello, {user?.full_name}</Text>
            <Text style={styles.userDate}>{today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.circle} >
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>

        <View style={styles.health}>
          <View style={styles.currentExerciseContainer}>
            <Text style={styles.currentExerciseText}>Health Overview</Text>
            {/* Show selected date in health section */}
            <Text style={styles.selectedDateText}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.healthsection}>
            <View style={styles.healthbox}>
              <View style={styles.iconHeader}>
                <Text style={styles.description}>Calories Burnt</Text>
                <View style={styles.iconContainer}>
                  <FireIcon />
                </View>
              </View>
              <Text style={styles.healthValue}>{calories}</Text>
            </View>
            <View style={styles.healthbox}>
              <View style={styles.iconHeader}>
                <Text style={styles.description}>Time in Bed</Text>
                <View style={styles.iconContainer}>
                  <SleepIcon />
                </View>
              </View>
             <Text style={styles.healthValue}>{sleep}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', margin: 10 }}>
          {weekDates.map(({ day, dayOfMonth, fullDate, isToday, isSelected }) => (
            <CustomDate 
              key={day} 
              day={day} 
              dayOfMonth={dayOfMonth} 
              isToday={isToday}
              isSelected={isSelected}
              onPress={() => handleDatePress(fullDate)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Custom Alert Component */}
      <CustomAlert
        visible={customAlertVisible}
        title="Error"
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
      <ChallengePopUp
        challenges={challenges}
        visible={challengePopUpVisible}
        onAccept={handleAcceptChallenge}
        onDecline={handleDeclineChallenge}
        onClose={() => setChallengePopUpVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    position: 'relative', 
    marginTop: 10 
  },
  sectionTitle: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    alignItems: 'center' 
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10 
  },
  upperRow: {
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     marginHorizontal: 20, 
     marginTop: 20, 
     alignItems: 'center' 
    },
  user: {
     flexDirection: 'column' 
    },
  userText: {
     fontSize: 32, 
     fontWeight: '600' 
    },
  userDate: {
     fontSize: 16, 
     color: '#A4A4A8' 
    },
    circle: {
      width: 100,           
      height: 100,
      borderRadius: 50,  
      overflow: 'hidden',   
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0', 
      margin: 5,
    },
  image: {
     width: '100%', 
     height: '100%' 
    },
  health: {
     margin: 20 
    },
  healthtitletext: {
    fontWeight: '500',
    fontSize: 24 
  },
  healthsection: {
     flexDirection: 'row', 
     justifyContent: 'space-between'
    },
  healthbox: {
    width: width / 2 - 25,
    padding: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A4A4A8' 
  },
  iconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap' 
  },
  description: {
    fontWeight: '500',
    fontSize: 20,
    flexShrink: 2,
    maxWidth: '75%',
    flexDirection: 'column'
  },
  iconContainer: {
    padding: 2, 
    marginLeft: 5
  },
  healthValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5 
  },
  currentExerciseContainer: {
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#6E49EB',
    paddingHorizontal: 8, 
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  currentExerciseText: {
    color: 'white',
    fontSize: 20 
  },
  selectedDateText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default home;