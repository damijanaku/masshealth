import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { mqttService, type MQTTLocationMessage } from '../services/mqtt';

// Use useSyncExternalStore for connection state to avoid setState in effect
function useConnectionState() {
  return useSyncExternalStore(
    (callback) => {
      mqttService.addConnectionListener(callback);
      return () => mqttService.removeConnectionListener(callback);
    },
    () => mqttService.isConnected()
  );
}

export function useMqtt() {
  const isConnected = useConnectionState();
  const [messages, setMessages] = useState<MQTTLocationMessage[]>([]);

  useEffect(() => {
    const handleMessage = (message: MQTTLocationMessage) => {
      setMessages(prev => {
        const filtered = prev.filter(m => m.senderId !== message.senderId);
        return [message, ...filtered].slice(0, 100);
      });
    };

    mqttService.addLocationListener(handleMessage);

    return () => {
      mqttService.removeLocationListener(handleMessage);
    };
  }, []);

  const connect = useCallback(() => {
    mqttService.connect();
  }, []);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  return {
    isConnected,
    messages,
    connect,
    disconnect,
  };
}