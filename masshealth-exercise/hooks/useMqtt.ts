import { useEffect, useState, useCallback, useRef } from "react";
import { mqttService, MQTTMessage, LocationMessage, MQTTConfig, Friend } from "@/services/MqttContext";

export function useMqtt(config?: MQTTConfig) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [locations, setLocations] = useState<LocationMessage[]>([]);
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!config || initialized.current) return;
    
    console.log('🚀 Initializing MQTT with config:', config);
    initialized.current = true;
  
    mqttService.initialize(config).catch(console.error);
  
    const handleConnection = (status: boolean) => {
      console.log('🔌 MQTT Connection status:', status);
      setConnected(status);
    };
    
    const handleMessage = (msg: MQTTMessage) => {
      console.log('Message received:', msg.message);
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    };
      
    const handleLocation = (location: LocationMessage) => {
      console.log('📍 Location received from:', location.senderName, 
        `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`);
      
      setLocations((prev) => {
        // Remove old location from same sender and add new one 
        const filtered = prev.filter(loc => loc.senderId !== location.senderId);
        const updated = [...filtered, location];
        console.log(`📍 Updated locations: ${updated.length} total`);
        return updated;
      });
    };
  
    mqttService.addConnectionListener(handleConnection);
    mqttService.addLocationListener(handleLocation);
    mqttService.addMessageListener(handleMessage);
    
    console.log('🎯 MQTT listeners registered');
  
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up MQTT listeners (component unmount)');
      mqttService.removeConnectionListener(handleConnection);
      mqttService.removeLocationListener(handleLocation);
      mqttService.removeMessageListener(handleMessage);
      initialized.current = false;
    };
  }, [config]); 

  const subscribeToFriendsLocations = useCallback(
    async (friends: Friend[]) => {
      console.log('🎯 Subscribing to friends locations:', {
        connected,
        friendsCount: friends.length,
        friends: friends.map(f => `${f.username} (${f.id})`)
      });
      
      if (!connected) {
        console.log('MQTT not connected, cannot subscribe yet');
        return false;
      }
      
      try {
        await mqttService.subscribeToFriendsLocations(friends);
        console.log(`✅ Successfully subscribed to ${friends.length} friends' locations`);
        return true;
      } catch (error) {
        console.error('❌ Failed to subscribe to friends locations:', error);
        return false;
      }
    },
    [connected]
  );

  return {
    connected,
    messages,
    locations,
    isConnected: connected,
    
    // Message methods
    subscribeToFriend: useCallback(
      (id: string) => mqttService.subscribeToFriend(id),
      []
    ),
    unsubscribeFromFriend: useCallback(
      (id: string) => mqttService.unsubscribeFromFriend(id),
      []
    ),
    publishMessage: useCallback(
      (id: string, text: string) => mqttService.publishMessage(id, text),
      []
    ),
    
    
    publishLocation: useCallback(
      (latitude: number, longitude: number, accuracy?: number) => {
        console.log('📍 Publishing location:', { latitude, longitude, accuracy });
        return mqttService.publishLocation(latitude, longitude, accuracy);
      },
      []
    ),
    subscribeToFriendsLocations,
    unsubscribeFromFriendsLocations: useCallback(
      (friends: Friend[]) => mqttService.unsubscribeFromFriendsLocations(friends),
      []
    ),
    subscribeToFriendLocation: useCallback(
      (friendId: string) => mqttService.subscribeToFriendLocation(friendId),
      []
    ),
    unsubscribeFromFriendLocation: useCallback(
      (friendId: string) => mqttService.unsubscribeFromFriendLocation(friendId),
      []
    ),

    forceReconnect: useCallback(
      () => mqttService.forceReconnect(),
      []
    ),
  };
}