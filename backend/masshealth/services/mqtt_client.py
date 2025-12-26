import paho.mqtt.client as mqtt
import ssl
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class MQTTClient:
    def __init__(self):
        self.client = None
        self.connected = False
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("SUCCESS! Connected to HiveMQ Cloud MQTT Broker!")
            self.connected = True
            
            client.subscribe("users/+/location")
            print("Subscribed to: users/+/location")
            
            client.subscribe("rivalries/+/updates")
            print("Subscribed to: rivalries/+/updates")
            
            client.subscribe("gyrosensor/+/data")
            print("Subscribed to: gyrosensor/+/data")
        else:
            print(f"FAILED to connect to MQTT broker, return code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        self.connected = False
        if rc != 0:
            print(f"Unexpected MQTT disconnection. Will auto-reconnect. Code: {rc}")
    
    def on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload = json.loads(msg.payload.decode())
            print(f"Received message on {topic}: {payload}")
            
            if "location" in topic:
                self.handle_location_update(topic, payload)
            elif "rivalries" in topic:
                self.handle_rivalry_update(topic, payload)
            elif "gyrosensor" in topic:
                self.handle_sensor_data(topic, payload)
        except json.JSONDecodeError:
            print(f"Failed to decode JSON from topic {topic}")
        except Exception as e:
            print(f"Error processing message from {topic}: {e}")
    
    def handle_location_update(self, topic, payload):
        parts = topic.split('/')
        if len(parts) >= 2:
            user_id = parts[1]
            
            try:
                from masshealth.models import UserLocation, CustomUser
                
                user = CustomUser.objects.get(id=user_id)
                
                UserLocation.objects.create(
                    user=user,
                    latitude=payload.get('latitude'),
                    longitude=payload.get('longitude'),
                    accuracy=payload.get('accuracy'),
                )
                print(f"Saved location for user {user.full_name} ({user_id})")
            except CustomUser.DoesNotExist:
                print(f"User with ID {user_id} not found")
            except Exception as e:
                print(f"Error saving location: {e}")
    
    def handle_rivalry_update(self, topic, payload):
        print(f"Rivalry update: {payload}")
        pass
    
    def handle_sensor_data(self, topic, payload):
        print(f"Sensor data: {payload}")
        pass
    
    def connect(self):
        """Connect to the MQTT broker"""
        config = settings.MQTT_CONFIG
        
        try:
            print(f"Creating MQTT client with ID: {config['client_id']}")
            
            self.client = mqtt.Client(
                client_id=config['client_id'],
                protocol=mqtt.MQTTv311
            )
            
            print(f"Setting credentials: {config['username']}")
            self.client.username_pw_set(config['username'], config['password'])
            
            if config['use_tls']:
                print("Configuring TLS...")
                self.client.tls_set(
                    cert_reqs=ssl.CERT_NONE,
                    tls_version=ssl.PROTOCOL_TLS
                )
                self.client.tls_insecure_set(True)
            
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_message = self.on_message
            
            print(f"Connecting to: {config['broker']}:{config['port']}")
            self.client.connect(config['broker'], config['port'], config['keepalive'])
            self.client.loop_start()
            
            print("MQTT client connection started successfully!")
            
        except Exception as e:
            print(f"ERROR connecting to MQTT broker: {e}")
            import traceback
            traceback.print_exc()
    
    def publish(self, topic, payload):
        if self.connected:
            self.client.publish(topic, json.dumps(payload), qos=1)
            print(f"Published to {topic}: {payload}")
        else:
            print(f"Cannot publish to {topic} - not connected to MQTT broker")
    
    def disconnect(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            print("Disconnected from MQTT broker")

mqtt_client = MQTTClient()