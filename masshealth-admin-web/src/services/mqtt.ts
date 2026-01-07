import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import type { MQTTLocationMessage } from '../types';

type MessageCallback = (message: MQTTLocationMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class MQTTService {
  private client: MqttClient | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private isConnecting = false;

  connect() {
    if (this.client?.connected || this.isConnecting) return;
    
    this.isConnecting = true;
    
    const broker = import.meta.env.VITE_MQTT_BROKER;
    const port = import.meta.env.VITE_MQTT_WEBSOCKET_PORT || '8884';
    const username = import.meta.env.VITE_MQTT_USERNAME;
    const password = import.meta.env.VITE_MQTT_PASSWORD;
    const useTLS = import.meta.env.VITE_MQTT_USE_TLS === 'true' || import.meta.env.VITE_MQTT_USE_TLS === 'True';
    
    const protocol = useTLS ? 'wss' : 'ws';
    const url = broker ? `${protocol}://${broker}:${port}/mqtt` : (import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001');
    
    console.log('MQTT Config:', { broker, port, username, password: password ? '***' : 'MISSING', useTLS, url });
    
    try {
      this.client = mqtt.connect(url, {
        clientId: `admin_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        username: username || undefined,
        password: password || undefined,
        protocolVersion: 4,
      });

      this.client.on('connect', () => {
        console.log('MQTT Connected successfully');
        this.isConnecting = false;
        this.notifyConnectionListeners(true);
        
        this.client?.subscribe('user/+/location', (err) => {
          if (err) console.error('Failed to subscribe:', err);
          else console.log('Subscribed to: user/+/location');
        });
      });

      this.client.on('message', (topic, payload) => {
        console.log('MQTT topic:', topic, 'payload:', payload.toString());
        
        try {
          const data = JSON.parse(payload.toString());
          const message: MQTTLocationMessage = {
            id: data.id || `${data.senderId || data.user_id || 'unknown'}-${Date.now()}`,
            senderId: String(data.senderId || data.user_id || data.userId || 'unknown'),
            senderName: data.senderName || data.user_name || data.userName || data.username || 'Unknown User',
            latitude: parseFloat(data.latitude || data.lat || 0),
            longitude: parseFloat(data.longitude || data.lng || data.lon || 0),
            timestamp: data.timestamp || Date.now(),
            accuracy: data.accuracy ? parseFloat(data.accuracy) : undefined,
          };
          console.log('Parsed message:', message);
          console.log('Callbacks count:', this.messageCallbacks.length);
          this.messageCallbacks.forEach(cb => cb(message));
        } catch (e) {
          console.error('Failed to parse MQTT message:', e);
        }
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.notifyConnectionListeners(false);
      });

      this.client.on('error', (err) => {
        console.error('MQTT Error:', err.message, err);
        this.isConnecting = false;
      });

      this.client.on('offline', () => {
        console.log('MQTT offline');
        this.notifyConnectionListeners(false);
      });

      this.client.on('reconnect', () => {
        console.log('MQTT reconnecting...');
      });

    } catch (err) {
      console.error('MQTT Connection Error:', err);
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.client?.end();
    this.client = null;
    this.notifyConnectionListeners(false);
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  addMessageListener(cb: MessageCallback) {
    this.messageCallbacks.push(cb);
  }

  removeMessageListener(cb: MessageCallback) {
    this.messageCallbacks = this.messageCallbacks.filter(c => c !== cb);
  }

  addConnectionListener(cb: ConnectionCallback) {
    this.connectionCallbacks.push(cb);
  }

  removeConnectionListener(cb: ConnectionCallback) {
    this.connectionCallbacks = this.connectionCallbacks.filter(c => c !== cb);
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }
}

export const mqttService = new MQTTService();