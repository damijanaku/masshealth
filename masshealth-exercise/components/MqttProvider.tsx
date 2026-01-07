import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useMqtt } from "@/hooks/useMqtt";
import { useAuth } from "@/hooks/useAuth";
import * as Location from "expo-location";

const MQTT_BROKER = "9f03cca8588b48b59bb6aad74976ac95.s1.eu.hivemq.cloud";
const MQTT_PORT = 8884;
const MQTT_USERNAME = "fitness_app_client";
const MQTT_PASSWORD = '#iVYhAS-2B"WihRr';
const MQTT_USE_SSL = true;

const MqttContext = createContext<any>(null);

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  const mqttConfig = useMemo(() => {
    if (loading || !profile) return undefined;

    console.log("Creating MQTT config for user:", profile.username);

    return {
      brokerUrl: MQTT_BROKER,
      brokerPort: MQTT_PORT,
      userId: profile.id,
      username: profile.username,
      clientId: `masshealth_${profile.id}`,
      mqttUsername: MQTT_USERNAME,
      mqttPassword: MQTT_PASSWORD,
      useSSL: MQTT_USE_SSL,
      path: "/mqtt",
    };
  }, [loading, profile?.id, profile?.username]);

  const mqtt = useMqtt(mqttConfig);

  useEffect(() => {
    if (!profile) return;
    let interval: ReturnType<typeof setInterval>;

    async function startPublishing() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission not granted");
        return;
      }

      interval = setInterval(async () => {
        if (mqtt.isConnected) {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            mqtt.publishLocation(
              loc.coords.latitude,
              loc.coords.longitude,
              loc.coords.accuracy ?? undefined
            );
          } catch (error) {
            console.error("Error publishing location:", error);
          }
        }
      }, 9000);
    }

    startPublishing();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profile, mqtt.isConnected]);

  return <MqttContext.Provider value={mqtt}>{children}</MqttContext.Provider>;
}

export const useMqttContext = () => useContext(MqttContext);