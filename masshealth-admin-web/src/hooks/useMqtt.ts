import { useState, useEffect, useCallback } from 'react';
import { mqttService } from '../services/mqtt';
import { MQTTLocationMessage } from '../types';

export function useMqtt() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MQTTLocationMessage[]>([]);

  useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected);
    };

    const handleMessage = (message: MQTTLocationMessage) => {
      setMessages(prev => {
        const filtered = prev.filter(m => m.senderId !== message.senderId);
        return [message, ...filtered].slice(0, 100);
      });
    };

    mqttService.addConnectionListener(handleConnection);
    mqttService.addMessageListener(handleMessage);
    setIsConnected(mqttService.isConnected());

    return () => {
      mqttService.removeConnectionListener(handleConnection);
      mqttService.removeMessageListener(handleMessage);
    };
  }, []);

  const connect = useCallback(() => {
    mqttService.connect();
  }, []);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  return { isConnected, messages, connect, disconnect };
}
