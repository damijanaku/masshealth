import mqtt, { MqttClient } from 'mqtt';
import { MQTTLocationMessage } from '../types';

type MessageCallback = (message: MQTTLocationMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class MQTTService {
  private client: MqttClient | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private isConnecting = false;

  connect(brokerUrl?: string) {
    if (this.client?.connected || this.isConnecting) return;
    
    this.isConnecting = true;
    const url = brokerUrl || import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001';
    
    try {
      this.client = mqtt.connect(url, {
        clientId: `admin_${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        console.log('MQTT Connected');
        this.isConnecting = false;
        this.notifyConnectionListeners(true);
        this.client?.subscribe('user/+/location');
      });

      this.client.on('message', (topic, payload) => {
        try {
          const message = JSON.parse(payload.toString()) as MQTTLocationMessage;
          this.messageCallbacks.forEach(cb => cb(message));
        } catch (e) {
          console.error('Failed to parse MQTT message:', e);
        }
      });

      this.client.on('close', () => {
        this.notifyConnectionListeners(false);
      });

      this.client.on('error', (err) => {
        console.error('MQTT Error:', err);
        this.isConnecting = false;
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
