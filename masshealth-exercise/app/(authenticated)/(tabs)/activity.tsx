import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { router } from 'expo-router'



const activity = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity  onPress={() => router.replace('../faceauth?authMode=2fa')}>
        <Text>Press</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    margin: 30
  },
});

export default activity