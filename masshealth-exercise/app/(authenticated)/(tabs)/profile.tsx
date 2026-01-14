import { View, Text, SafeAreaView, Image, StyleSheet, TouchableOpacity, Alert, FlatList, Button } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import ProfileIcon from '../../../assets/tsxicons/profilenavbaricon';
import SaveIcon from '../../../assets/tsxicons/saveicon';
import LogoutIcon from '../../../assets/tsxicons/logouticon';
import { router } from 'expo-router'
import Input from '../../../components/Input';
import DefButton from '../../../components/DefButton';
import CustomAlert from '../../../components/CustomAlert';  
import privateApi from '@/api';
import * as SecureStore from 'expo-secure-store'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { mqttService } from '@/services/MqttContext';
import { useUser } from '@/hooks/useUser';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

interface PendingRequest {
  id: any;
  status?: any;
  sender_id?: any;
  from_user: {  
    id: any;     
    name: string;
    username: string;
  };
}


interface Friend {
  connectionId: any;
  userId: any;
  name: string;
  username: string;
}

const Profile = () => {
  const { user, logout } = useUser();

  const [friendUsername, setFriendUsername] = useState(''); 
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertTitle, setCustomAlertTitle] = useState('Alert');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); 
  const [twofactorauth, setTwofactorAuth] = useState(false);
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile_image_url) {
      setImage(user.profile_image_url);
    }
  }, [user]);

  useEffect(() => {
    const load2FAStatus = async () => {
      const status = await check2FAStatus();
      setTwofactorAuth(status);
    };
    
    load2FAStatus();
  }, []);
  
  const handleLogout = async () => {
    try {
      if (mqttService.isConnected()) {
        await mqttService.disconnect();
      }
      await logout(); 
      router.replace('/login')
    } catch (error) {
      console.log("Error during logout:", error);
      await logout();
    }
  };

  const handle2FAToggle = async () => {
    if(twofactorauth){
      setEnabling2FA(true);

      try {
        const result = await disable2FA()
  
        if (result.success) {
          setTwofactorAuth(false);
        } else {
          setCustomAlertTitle('Error');
          setCustomAlertMessage('Failed to disable two-factor authentication');
          setCustomAlertVisible(true);
        }
      } catch (error) {
          console.error("Error disabling 2FA:", error);
          setCustomAlertTitle('Error');
          setCustomAlertMessage('An error occurred while disabling 2FA');
          setCustomAlertVisible(true);
      } finally {
        setEnabling2FA(false);
      }
    } else {
      setEnabling2FA(true);
      try {
        const result = await enable2FA();
        
        if (result.success) {
          setTwofactorAuth(true)
          router.replace('../faceauth?authMode=set2fa')
        } else {
          setCustomAlertTitle('Error');
          setCustomAlertMessage('Failed to enable two-factor authentication');
          setCustomAlertVisible(true);
        }
      } catch (error) {
        console.error("Error enabling 2FA:", error);
        setCustomAlertTitle('Error');
        setCustomAlertMessage('An error occurred while enabling 2FA');
        setCustomAlertVisible(true);
      } finally {
        setEnabling2FA(false);
      }
    }

    
  };

  const check2FAStatus = async () => {
    try {
      const response = await privateApi.get('/api/auth/profile/get-2fa/');
      return response.data.two_factor_auth;

    } catch (error) {
      console.error("Error catching two factor auth data", error);
    }

    
  }

  const enable2FA = async (): Promise<{success: boolean; message?: string}> => {
    try {
      const response = await privateApi.post('/api/auth/profile/update-2fa/', {two_factor_auth: true});
      return {
        success: true,
        message: response.data.message || '2FA enabled successfully'
      };
    } catch (error: any) {
      console.error("Error enabling two factor auth", error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to enable 2FA'
      };
    }
  }
  
  const disable2FA = async (): Promise<{success: boolean; message?: string}> => {
    try {
      const response = await privateApi.post('/api/auth/profile/update-2fa/', {two_factor_auth: false});
      return {
        success: true,
        message: response.data.message || '2FA disabled successfully'
      };
    } catch (error: any) {
      console.error("Error disabling two factor auth", error);
      return {
        success: false,
        message: error.response?.data?.error || 'Failed to disable 2FA'
      };
    }
  }



  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const response = await privateApi.get('/api/auth/pending-requests/');

      if (response.data.success) {
        setPendingRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error("Error catching pending requests", error);

    } finally {      
      setIsLoading(false);

    }
  };

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

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await privateApi.post(`/api/auth/accept-friend-request/${requestId}/`);
      
      if (response.data.success) {
        setCustomAlertMessage('Friend request accepted!');
        fetchPendingRequests(); // Refresh the list
        fetchFriends(); // Refresh friends list
      } else {
        setCustomAlertMessage(response.data.message);
      }
    } catch (error) {
      setCustomAlertMessage('Error accepting friend request');
    } finally {
      setCustomAlertVisible(true);
    }
  };

  const handleSendRequest = async () => {
    if (!friendUsername.trim()) {
      setCustomAlertMessage('Please enter a username');
      setCustomAlertVisible(true);
      return;
    }
  
    try {
      setIsLoading(true);
      
      // First search for the user
      const searchResponse = await privateApi.post('/api/auth/search-users/', {
        username: friendUsername
      });
  
      if (searchResponse.data.success && searchResponse.data.users.length > 0) {
        const user = searchResponse.data.users[0];
        
        // Send friend request
        const response = await privateApi.post(`/api/auth/send-friend-request/${user.id}/`);
        
        if (response.data.success) {
          setCustomAlertMessage('Friend request sent successfully!');
          setFriendUsername('');
        } else {
          setCustomAlertMessage(response.data.message);
        }
      } else {
        setCustomAlertMessage('User not found');
      }
    } catch (error) {
      setCustomAlertMessage('Error sending friend request');
    } finally {
      setIsLoading(false);
      setCustomAlertVisible(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchPendingRequests();
    } else if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('Image picker result is:', result);

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage); 
      await uploadImage(selectedImage);
    }
  };

  const uploadImage = async (imageURI: string) => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN);
      
      const formData = new FormData();
      const filename = imageURI.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_image', {
        uri: imageURI,
        name: filename || "profile.jpeg",
        type: type
      } as any);

      console.log('Uploading image...');
      const response = await axios.post(
        'http://164.8.222.74:8000/api/auth/profile/upload-image/',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      console.log('Upload response:', response.data);

      // Refresh profile t
      const profileResponse = await privateApi.get('/api/auth/profile/');
      if (profileResponse.data.profile_image_url) {
        setImage(profileResponse.data.profile_image_url);
        console.log('Profile image updated:', profileResponse.data.profile_image_url);
      }

      return response.data;
      
    } catch (error) {
      console.error('Upload error:', error);
      if (user?.profile_image_url) {
        setImage(user.profile_image_url);
      }
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ProfileIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Profile</Text>
      </View>
      
      <View style={styles.upperRow}>
        <TouchableOpacity style={styles.circle} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.nameofuser}>{user?.full_name || 'User'}</Text>
        <Text style={styles.username}>@{user?.username || ''}</Text>
        
        <TouchableOpacity onPress={pickImage} style={styles.changeImageButton}>
          <Text style={styles.changeImageText}>
            {image ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Preferences</Text>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: twofactorauth ? '#ff6b6b' : '#6E49EB' }
          ]}
          onPress={async () => {
            await handle2FAToggle();
            if (!twofactorauth) { 
              //router.push('../FaceAuthTakePic');
            }
          }}
          disabled={enabling2FA}
        >
          <Text style={styles.toggleButtonText}>
            {enabling2FA ? 'Processing...' : (twofactorauth ? "Disable 2FA" : "Enable 2FA")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <LogoutIcon stroke="#6E49EB" strokeWidth={18} width={24} height={24} fillColor="none" />
          <View style={styles.optiontitle}>
            <Text style={styles.optiontext}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Friends</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'add' && styles.activeTab]} 
            onPress={() => setActiveTab('add')}
          >
            <Text style={styles.tabText}>Add Friend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]} 
            onPress={() => setActiveTab('requests')}
          >
            <Text style={styles.tabText}>Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]} 
            onPress={() => setActiveTab('friends')}
          >
            <Text style={styles.tabText}>My Friends</Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'add' && (
          <View style={styles.addFriendContainer}>
            <Input 
              onChangeText={setFriendUsername} 
              placeholder='Enter username' 
              value={friendUsername} 
            />
            <DefButton text='Add friend' onPress={handleSendRequest} />
          </View>
        )}
        
        {activeTab === 'requests' && (
          <View style={styles.requestsContainer}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : pendingRequests.length === 0 ? (
              <Text style={styles.emptyStateText}>No pending friend requests</Text>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={({ item }) => (
                  <View style={styles.requestItem}>
                    <View style={styles.requestUserInfo}>
                      <Text style={styles.requestUserName}>
                        {item.from_user?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.requestUsername}>
                        @{item.from_user?.username || 'unknown'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.acceptButton} 
                      onPress={() => handleAcceptRequest(item.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}
        
        {activeTab === 'friends' && (
          <View style={styles.friendsContainer}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : friends.length === 0 ? (
              <Text style={styles.emptyStateText}>You don't have any friends yet</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.connectionId}
                renderItem={({ item }) => (
                  <View style={styles.friendItem}>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendUsername}>@{item.username}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>

      <CustomAlert
        visible={customAlertVisible}
        title={customAlertTitle}
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  changeImageButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#6E49EB',
    borderRadius: 20,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
  upperRow: {
    marginHorizontal: width * 0.02,
    marginVertical: height * 0.01,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  circle: {
    width: 100,           
    height: 100,
    borderRadius: 50,  
    overflow: 'hidden',   
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', 
    margin: 10,
    borderWidth: 2,
    borderColor: '#6E49EB',
  },
  nameofuser: {
    fontSize: width > 600 ? 20 : 16,
    fontWeight: '600'
  },
  username: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8'
  },
  subsectiontitle: {
    marginHorizontal: 10
  },
  subsectiontitletext: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8',
    fontWeight: '500',
    margin: 10
  },
  option: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5
  },
  optiontitle: {
    margin: 10,
  },
  optiontext: {
    fontSize: 16,
    fontWeight: '500'
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6E49EB',
    backgroundColor: '#f8f4ff',
  },
  tabText: {
    fontWeight: '500',
  },
  addFriendContainer: {
    marginBottom: 10,
  },
  requestsContainer: {
    marginBottom: 15,
  },
  loadingText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
  },
  emptyStateText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  requestUserInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestUsername: {
    fontSize: 14,
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#6E49EB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '500',
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
  toggleButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;