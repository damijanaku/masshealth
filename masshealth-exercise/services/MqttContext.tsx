import { Client, Message } from "paho-mqtt";

export interface MQTTMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface LocationMessage {
  id: string;
  senderId: string;
  senderName: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface Friend {
  id: string;
  username: string;
}

export interface MQTTConfig {
  brokerUrl: string;
  brokerPort: number;
  userId: string;
  username: string;
  clientId: string;
}

class MqttService {
  private client: Client | null = null;
  private config: MQTTConfig | null = null;
  private messageCallbacks: ((message: MQTTMessage) => void)[] = [];
  private locationCallbacks: ((location: LocationMessage) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private subscribedTopics: Set<string> = new Set();
  private reconnectInterval = 5000;
  private shouldReconnect = true;
  private isConnecting = false;

  async initialize(config: MQTTConfig): Promise<void> {
    this.config = config;
    this.shouldReconnect = true;

    if (this.client?.isConnected()) {
      console.log("MQTT already connected, skipping init");
      return;
    }

    return this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || !this.config) return;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const clientId = `${this.config!.clientId}_${Date.now()}`;
        this.client = new Client(
          this.config!.brokerUrl,
          this.config!.brokerPort,
          clientId
        );

        this.client.onConnectionLost = this.onConnectionLost.bind(this);
        this.client.onMessageArrived = this.onMessageArrived.bind(this);

        this.client.connect({
          cleanSession: true,
          keepAliveInterval: 60,
          timeout: 15,
          onSuccess: () => {
            console.log("MQTT Connected");
            this.isConnecting = false;
            this.notifyConnectionListeners(true);
            this.resubscribeToTopics();
            resolve();
          },
          onFailure: (err) => {
            console.error("MQTT connect error:", err);
            this.isConnecting = false;
            this.notifyConnectionListeners(false);
            setTimeout(() => {
              if (this.shouldReconnect) this.connect();
            }, this.reconnectInterval);
            reject(err);
          },
        });
      } catch (err) {
        console.error("Connect exception:", err);
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  private onConnectionLost(resp: any): void {
    console.log("Connection lost:", resp.errorMessage);
    this.notifyConnectionListeners(false);

    if (this.shouldReconnect) {
      console.log("Attempting auto-reconnect in 5s");
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  private onMessageArrived(message: Message): void {
    console.log("Raw MQTT:", message.destinationName, message.payloadString);
    try {
      const topic = message.destinationName;
      const payload = JSON.parse(message.payloadString);
      
      if (topic.includes('/location')) {
        const locationMessage: LocationMessage = payload;
        console.log("Location received:", locationMessage);
        console.log(" Calling", this.locationCallbacks.length, "location listeners");
        this.locationCallbacks.forEach((cb) => cb(locationMessage));
      } else if (topic.includes('/message')) {
        const mqttMessage: MQTTMessage = payload;
        console.log("Message received:", mqttMessage);
        this.messageCallbacks.forEach((cb) => cb(mqttMessage));
      }
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  }

  async publishLocation(latitude: number, longitude: number, accuracy?: number): Promise<void> {
    if (!this.client?.isConnected() || !this.config)
      throw new Error("MQTT not connected");

    const locationMsg: LocationMessage = {
      id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: this.config.userId,
      senderName: this.config.username,
      latitude,
      longitude,
      timestamp: Date.now(),
      accuracy,
    };

    const mqttMsg = new Message(JSON.stringify(locationMsg));
    mqttMsg.destinationName = `user/${this.config.userId}/location`;
    mqttMsg.qos = 1;
    mqttMsg.retained = true;

    this.client.send(mqttMsg);
    console.log("Location sent:", locationMsg);
  }

  async subscribeToFriendsLocations(friends: Friend[]): Promise<void> {
    if (!this.client?.isConnected()) throw new Error("MQTT not connected");

    for (const friend of friends) {
      const topic = `user/${friend.id}/location`;
      this.client.subscribe(topic, { qos: 1 });
      this.subscribedTopics.add(topic);
      console.log(`Subscribed to ${friend.username}'s location: ${topic}`);
    }
  }

  async unsubscribeFromFriendsLocations(friends: Friend[]): Promise<void> {
    if (!this.client?.isConnected()) return;

    for (const friend of friends) {
      const topic = `user/${friend.id}/location`;
      this.client.unsubscribe(topic);
      this.subscribedTopics.delete(topic);
      console.log(`Unsubscribed from ${friend.username}'s location: ${topic}`);
    }
  }

  async subscribeToFriendLocation(friendId: string): Promise<void> {
    if (!this.client?.isConnected()) throw new Error("MQTT not connected");

    const topic = `user/${friendId}/location`;
    this.client.subscribe(topic, { qos: 1 });
    this.subscribedTopics.add(topic);
    console.log(`Subscribed to location: ${topic}`);
  }

  async unsubscribeFromFriendLocation(friendId: string): Promise<void> {
    if (!this.client?.isConnected()) return;

    const topic = `user/${friendId}/location`;
    this.client.unsubscribe(topic);
    this.subscribedTopics.delete(topic);
    console.log(`Unsubscribed from location: ${topic}`);
  }

  async subscribeToFriend(friendId: string): Promise<void> {
    if (!this.client?.isConnected()) throw new Error("MQTT not connected");

    const topic = `user/${friendId}/message`;
    this.client.subscribe(topic, { qos: 1 });
    this.subscribedTopics.add(topic);
    console.log(`Subscribed to ${topic}`);
  }

  async unsubscribeFromFriend(friendId: string): Promise<void> {
    if (!this.client?.isConnected()) return;

    const topic = `user/${friendId}/message`;
    this.client.unsubscribe(topic);
    this.subscribedTopics.delete(topic);
    console.log(`Unsubscribed from ${topic}`);
  }

  private async resubscribeToTopics(): Promise<void> {
    for (const topic of this.subscribedTopics) {
      this.client?.subscribe(topic, { qos: 1 });
      console.log(`Re-subscribed to ${topic}`);
    }
  }

  async publishMessage(friendId: string, text: string): Promise<void> {
    if (!this.client?.isConnected() || !this.config)
      throw new Error("MQTT not connected");

    const msg: MQTTMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: this.config.userId,
      senderName: this.config.username,
      message: text,
      timestamp: Date.now(),
    };

    const mqttMsg = new Message(JSON.stringify(msg));
    mqttMsg.destinationName = `user/${friendId}/message`;
    mqttMsg.retained = true;
    mqttMsg.qos = 1;

    this.client.send(mqttMsg);
    console.log("Sent:", msg);
  }

  addLocationListener(cb: (location: LocationMessage) => void) {
    console.log('listen')
    this.locationCallbacks.push(cb);
  }
  
  removeLocationListener(cb: (location: LocationMessage) => void) {
    this.locationCallbacks = this.locationCallbacks.filter((c) => c !== cb);
  }
  

  // Message listeners 
  addMessageListener(cb: (msg: MQTTMessage) => void) {
    this.messageCallbacks.push(cb);
  }
  
  removeMessageListener(cb: (msg: MQTTMessage) => void) {
    this.messageCallbacks = this.messageCallbacks.filter((c) => c !== cb);
  }
  
  addConnectionListener(cb: (status: boolean) => void) {
    this.connectionCallbacks.push(cb);
  }
  
  removeConnectionListener(cb: (status: boolean) => void) {
    this.connectionCallbacks = this.connectionCallbacks.filter((c) => c !== cb);
  }
  
  private notifyConnectionListeners(status: boolean) {
    this.connectionCallbacks.forEach((cb) => cb(status));
  }


  isConnected(): boolean {
    return this.client?.isConnected() ?? false;
  }
  
  async disconnect(): Promise<void> {
    console.log(" Disconnecting...");
    this.shouldReconnect = false;
    this.client?.disconnect();
    this.notifyConnectionListeners(false);
  }
  
  async forceReconnect(): Promise<void> {
    console.log("Force reconnect");
    this.disconnect();
    this.shouldReconnect = true;
    setTimeout(() => this.connect(), 1000);
  }
  
}

export const mqttService = new MqttService();

