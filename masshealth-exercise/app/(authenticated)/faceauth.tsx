import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import privateApi from '@/api';
import axios from 'axios';
import { ACCESS_TOKEN } from '@/constants';

interface PhotoData {
    uri: string,
}



const faceauth = () => {
    const [facing, setFacing] = useState<CameraType>('front');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const { user, logout } = useUser();
    const { authMode } = useLocalSearchParams<{
      authMode: string;
    }>();


    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (!permission) {
        return <View />;
    }
    
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera!</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    
const takePicture = async () => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN);

  if (authMode === "set2fa"){

    try {
      const photo = await cameraRef.current?.takePictureAsync({ 
          base64: true, 
          exif: false 
      });
      
      if (photo) {
          const formData = new FormData();
          const filename = `${user?.username}/slika${new Date().toLocaleDateString()}`;
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('image', {
              uri: photo.uri,
              name: filename || "profile.jpeg",
              type: type
          } as any);

          console.log('Uploading image...');

          const response = await axios.post(
              'http://192.168.1.18:8000/api/auth/enroll/',
              formData,
              {
                headers: {
                  'Authorization': `Bearer ${token}`, 
                  'Content-Type': 'multipart/form-data',
                },
                timeout: 30000,
              }
          );


          if (response.status === 201) {
              router.replace('/(authenticated)/(tabs)/profile')
          }

      }

      
  } catch (error) {
      console.error('Error taking photos', error);
      Alert.alert('Error', 'Error taking pic');
  }
  } else if (authMode == "2fa"){
    
      try {
        const photo = await cameraRef.current?.takePictureAsync({ 
          base64: true, 
          exif: false
          });
          
        if (photo) {
          const formData = new FormData();
          const filename = "profile.jpeg";
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('image', {
              uri: photo.uri,
              name: filename,
              type: type
          } as any);

          const response = await axios.post(
            'http://192.168.1.18:8000/api/auth/authenticate_2fa/',
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'multipart/form-data',
              },
              timeout: 30000,
            }
          );

          if (response.status === 200){
            console.log(`sim: ${response.data.similarity}`)
            router.replace('/(authenticated)/(tabs)/home')
          } else if (response.status === 401) {
            console.log(`sim: ${response.data.similarity}`)
          }
        }  

      } catch (error) {
        console.error('Error taking photos', error);
        Alert.alert('Error', 'Error taking pic');
      }
  }
    
};


  return (
    <View style={styles.container}>
    <View style={styles.photoCounter}>
      <Text style={styles.photoCounterText}>
      </Text>
    </View>
    
    <CameraView 
      style={styles.camera} 
      facing={facing}
      ref={cameraRef}>
    </CameraView>
    
    <View style={styles.buttonContainer}>

    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
        <Text style={styles.text}>Flip Camera</Text>
    </TouchableOpacity>
      
      
      <TouchableOpacity 
        style={styles.button}
        onPress={takePicture}
      >
        <Text style={styles.text}>
          {isUploading ? 'Uploading...' : `Take Photo `}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  )
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      marginBottom: 30
    },
    message: {
      textAlign: 'center',
      paddingBottom: 10,
    },
    camera: {
      flex: 1,
    },
    photoCounter: {
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 10,
      alignItems: 'center',
    },
    photoCounterText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    buttonContainer: {
      flex: 0,
      flexDirection: 'row',
      maxHeight: 64,
      margin: 16,
      gap: 10
    },
    disabledButton: {
      backgroundColor: '#999',
      opacity: 0.6,
    },
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#6E49EB',
      padding: 10,
      borderRadius: 8,
    },
    uploadButton: {
      backgroundColor: '#28a745', 
    },
    text: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
  });

export default faceauth
