import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useMqtt } from "@/hooks/useMqtt";
import { useAuth } from "@/hooks/useAuth";
import * as Location from "expo-location";

const MqttContext = createContext<any>(null);

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  const mqttConfig = useMemo(() => {
    if (loading || !profile) return undefined;
    
    return {
      brokerUrl: "10.0.2.2",
      brokerPort: 9001,
      userId: profile.id,
      username: profile.username,
      clientId: "myAppClient",
    };
  }, [loading, profile?.id, profile?.username]);

  const mqtt = useMqtt(mqttConfig);

  useEffect(() => {
    if (!profile) return;
    let interval: ReturnType<typeof setInterval>;

    async function startPublishing() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      interval = setInterval(async () => {
        if (mqtt.isConnected) {
          const loc = await Location.getCurrentPositionAsync({});
          mqtt.publishLocation(
            loc.coords.latitude,
            loc.coords.longitude,
            loc.coords.accuracy ?? undefined
          );
        }
      }, 9000); 
    }

    startPublishing();
    return () => { if (interval) clearInterval(interval); };
  }, [profile, mqtt]);

  return <MqttContext.Provider value={mqtt}>{children}</MqttContext.Provider>;
}

export const useMqttContext = () => useContext(MqttContext);