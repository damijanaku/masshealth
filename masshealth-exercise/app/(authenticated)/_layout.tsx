import { Stack } from "expo-router";
import ProtectedRoute from "@/components/ProtectedRoute";
import { MqttProvider } from "@/components/MqttProvider";

export default function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <MqttProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="tags" options={{ title: "tags" }} />
          <Stack.Screen name="userstats" options={{ title: "userstats" }} />
          <Stack.Screen name="map" options={{ title: "Map" }} />
          <Stack.Screen name="createroutine" options={{ title: "CreateRoutine" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routinepreview" />
        </Stack>
      </MqttProvider>
    </ProtectedRoute>
  );
}
