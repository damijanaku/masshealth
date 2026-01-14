import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

// Location message type
export interface MQTTLocationMessage {
  id: string;
  senderId: string;
  senderName: string;
  latitude: number;
  longitude: number;
  timestamp: number | string;
  accuracy?: number;
}

// Steps message type
export interface MQTTStepsMessage {
  steps: number;
  timestamp: number;
  dateTime: string;
  userId?: string;
  deviceId?: string;
}

// Raw steps data from MQTT (flexible typing)
interface RawStepsData {
  steps?: number;
  step_count?: number;
  count?: number;
  value?: number;
  timestamp?: number;
  userId?: string;
  deviceId?: string;
}

type LocationCallback = (message: MQTTLocationMessage) => void;
type StepsCallback = (message: MQTTStepsMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class MQTTService {
  private client: MqttClient | null = null;
  private locationCallbacks: LocationCallback[] = [];
  private stepsCallbacks: StepsCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private isConnecting = false;
  private subscribedTopics: Set<string> = new Set();

  connect() {
    if (this.client?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const broker = import.meta.env.VITE_MQTT_BROKER;
    const port = import.meta.env.VITE_MQTT_WEBSOCKET_PORT || '8884';
    const username = import.meta.env.VITE_MQTT_USERNAME;
    const password = import.meta.env.VITE_MQTT_PASSWORD;
    const useTLS = import.meta.env.VITE_MQTT_USE_TLS === 'true' || import.meta.env.VITE_MQTT_USE_TLS === 'True';

    const protocol = useTLS ? 'wss' : 'ws';
    const url = broker
      ? `${protocol}://${broker}:${port}/mqtt`
      : (import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001');

    console.log('MQTT Config:', {
      broker,
      port,
      username,
      password: password ? '***' : 'MISSING',
      useTLS,
      url
    });

    try {
      this.client = mqtt.connect(url, {
        clientId: `dashboard_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
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

        // Subscribe to location topic
        this.subscribe('user/+/location');

        // Subscribe to steps topic
        this.subscribe('sensor/steps');
      });

      this.client.on('message', (topic, payload) => {
        console.log('MQTT topic:', topic, 'payload:', payload.toString());

        try {
          const data = JSON.parse(payload.toString());

          if (topic.includes('/location')) {
            this.handleLocationMessage(data);
          } else if (topic === 'sensor/steps' || topic.includes('/steps')) {
            const steps = parseInt(payload.toString(), 10);
            if (!isNaN(steps)) {
              data.steps = steps;
              this.handleStepsMessage(data as RawStepsData);
            }
          }
        } catch {
          // Handle raw number payloads like "9"
          if (topic === 'sensor/steps' || topic.includes('/steps')) {
            const steps = parseInt(payload.toString(), 10);
            if (!isNaN(steps)) {
              this.handleStepsMessage({ steps });
            }
          } else {
            console.error('Failed to parse MQTT message');
          }
        }
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.subscribedTopics.clear();
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

  private subscribe(topic: string) {
    if (this.subscribedTopics.has(topic)) {
      return;
    }

    this.client?.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to: ${topic}`);
        this.subscribedTopics.add(topic);
      }
    });
  }

  private handleLocationMessage(data: Record<string, unknown>) {
    const message: MQTTLocationMessage = {
      id: (data.id as string) || `${data.senderId || data.user_id || 'unknown'}-${Date.now()}`,
      senderId: String(data.senderId || data.user_id || data.userId || 'unknown'),
      senderName: (data.senderName || data.user_name || data.userName || data.username || 'Unknown User') as string,
      latitude: parseFloat(String(data.latitude || data.lat || 0)),
      longitude: parseFloat(String(data.longitude || data.lng || data.lon || 0)),
      timestamp: (data.timestamp as number | string) || Date.now(),
      accuracy: data.accuracy ? parseFloat(String(data.accuracy)) : undefined,
    };

    console.log('Parsed location message:', message);
    this.locationCallbacks.forEach(cb => cb(message));
  }

  private handleStepsMessage(data: RawStepsData) {
    const now = new Date();
    const timestamp = data.timestamp ?? now.getTime();
    const date = new Date(timestamp);

    const dateTime = date.toLocaleString('sl-SI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const steps = data.steps ?? data.step_count ?? data.count ?? data.value ?? 0;

    const message: MQTTStepsMessage = {
      steps,
      timestamp,
      dateTime,
      userId: data.userId,
      deviceId: data.deviceId,
    };

    console.log('Parsed steps message:', message);
    this.stepsCallbacks.forEach(cb => cb(message));
  }

  disconnect() {
    this.client?.end();
    this.client = null;
    this.subscribedTopics.clear();
    this.notifyConnectionListeners(false);
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  // Location listeners
  addLocationListener(cb: LocationCallback) {
    this.locationCallbacks.push(cb);
  }

  removeLocationListener(cb: LocationCallback) {
    this.locationCallbacks = this.locationCallbacks.filter(c => c !== cb);
  }

  // Steps listeners
  addStepsListener(cb: StepsCallback) {
    this.stepsCallbacks.push(cb);
  }

  removeStepsListener(cb: StepsCallback) {
    this.stepsCallbacks = this.stepsCallbacks.filter(c => c !== cb);
  }

  // Connection listeners
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