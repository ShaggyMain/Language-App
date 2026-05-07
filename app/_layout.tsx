import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { refreshAuthState, subscribeAuthState } from "../lib/auth";
import { getRepos } from "../lib/db";
import { syncPull } from "../lib/sync";

export default function RootLayout() {
  useEffect(() => {
    void refreshAuthState();
    const unsub = subscribeAuthState(async (uid) => {
      if (uid === "local") return;
      const repos = await getRepos();
      void syncPull(repos);
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0b1220" },
            headerTintColor: "#e6ecf5",
            contentStyle: { backgroundColor: "#0b1220" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="[language]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="login" options={{ title: "Sign in" }} />
          <Stack.Screen name="register" options={{ title: "Create account" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
