import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!supabase) {
      setError("Cloud sync is not configured in this build.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace("/");
  }

  return (
    <Screen title="Sign in">
      {!supabaseConfigured ? (
        <View className="bg-warning/15 border border-warning rounded-xl px-3 py-3 mb-4">
          <Text className="text-text">
            Cloud sync isn't configured. The app works offline; sign-in is optional.
          </Text>
        </View>
      ) : null}

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Email</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-text mb-4"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor="#8aa0c2"
      />

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Password</Text>
      <TextInput
        className="bg-surface border border-border rounded-xl px-4 py-3 text-text mb-4"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="••••••••"
        placeholderTextColor="#8aa0c2"
      />

      {error ? <Text className="text-error mb-3">{error}</Text> : null}

      <Pressable
        onPress={handleSignIn}
        disabled={busy || !email || !password}
        className={`rounded-xl px-4 py-4 items-center ${busy || !email || !password ? "bg-surface border border-border" : "bg-en"}`}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Sign in</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/register")} className="mt-4 items-center py-2">
        <Text className="text-muted">Don't have an account? Create one</Text>
      </Pressable>
    </Screen>
  );
}
