import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { router } from 'expo-router'
import ActivityIcon from '@/assets/tsxicons/activitynavbaricon'
import { ScrollView } from 'react-native'
import privateApi from '@/api'
import PopUp from '@/components/popUp'
import CustomAlert from '@/components/CustomAlert'
import { getApp } from '@react-native-firebase/app'
import { getMessaging } from '@react-native-firebase/messaging'


interface Friend {
  id: number;  
  name: string;
  username: string;
  profile_image_url?: string;
}

interface Routine {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const activity = () => {
  const [friendUsername, setFriendUsername] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertTitle, setCustomAlertTitle] = useState('Alert');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [challengePopupVisible, setChallengePopupVisible] = useState(false);
  const [loadingRoutines, setLoadingRoutines] = useState(true);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);

  useEffect(() => {
      fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      const response =  await privateApi.get('/api/auth/friends-list');
      
      if (response.data.success) {
        setFriends(response.data.friends)
      }
    } catch (error) {
      console.error("Error catching friends", error);
    } finally {
      setIsLoading(false)
    }
  };

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

  const challengeFriend = async (friend: Friend, routineId: number) => {
    try {
      const response = await privateApi.post(
        `/api/auth/challenge/${friend.id}/${routineId}/`,
        {}
      );
  
      if (response.data.success) {
        
        
        setCustomAlertTitle('Success');
        setCustomAlertMessage(`Challenge sent to ${friend.name}!`);
        setCustomAlertVisible(true);
      } else {
        setCustomAlertTitle('Error');
        setCustomAlertMessage('Failed to send challenge. Please try again.');
        setCustomAlertVisible(true);
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('An error occurred while sending the challenge.');
      setCustomAlertVisible(true);
    }
  };
  
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ActivityIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Challenge</Text>
      </View>
  
      <View style={styles.title}>
        <Text style={styles.titleText}>Who do you want to challenge next?</Text>
      </View>
  
      <View style={styles.friendsContainer}>
        <FlatList
          data={friends}
          style={{ marginTop: 10, paddingHorizontal: 20 }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <TouchableOpacity
                style={styles.friendInfo}
                onPress={() => {
                  setSelectedFriend(item);
                  setChallengePopupVisible(true);
                  fetchRoutines();
                }}>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendUsername}>@{item.username}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
  
      {challengePopupVisible && selectedFriend != null && (
        <PopUp
          Title="Choose workout and confirm"
          Routines={userRoutines} 
          visible={challengePopupVisible}
          onConfirm={(routineId: number) => { 
            setChallengePopupVisible(false);
            challengeFriend(selectedFriend, routineId);
            setSelectedFriend(null);
          }}
          onCancel={() => {
            setChallengePopupVisible(false);
            setSelectedFriend(null);
          }}
        />
      )}
  
      <CustomAlert
        visible={customAlertVisible}
        title={customAlertTitle}
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
  
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  titleText: {
    fontSize: 26, 
    fontWeight: '600' 
   },
   friendsContainer: {
    marginBottom: 15,
  },

   friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
  },
});

export default activity