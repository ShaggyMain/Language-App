import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { refreshAuthState, subscribeAuthState } from "../lib/auth";
import { getRepos } from "../lib/db";
import { syncPull } from "../lib/sync";
import { THEME_VARS, useTheme } from "../lib/theme";

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

  const { name, colors } = useTheme();

  return (
    <GestureHandlerRootView style={[{ flex: 1 }, THEME_VARS[name]]}>
      <SafeAreaProvider>
        <StatusBar style={name === "dark" ? "light" : "dark"} />
        <View style={[{ flex: 1, backgroundColor: colors.bg }, THEME_VARS[name]]}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="login" options={{ title: "Sign in" }} />
            <Stack.Screen name="register" options={{ title: "Create account" }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
