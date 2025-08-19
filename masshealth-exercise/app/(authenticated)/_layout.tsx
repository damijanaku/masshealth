import { router, Stack, Tabs } from "expo-router";
import { useEffect } from "react";

export default function TabsLayout() {
  return (
    <Stack 
  screenOptions={{ headerShown: false }}
    >
     
      <Stack.Screen name="app" 
                  options={{ title: "app", 
                  }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />      
       
      
    </Stack>
  );
}