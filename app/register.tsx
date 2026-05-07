import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignUp() {
    if (!supabase) {
      setError("Cloud sync is not configured in this build.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err, data } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.replace("/");
    } else {
      setInfo("Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <Screen title="Create account">
      {!supabaseConfigured ? (
        <View className="bg-warning/15 border border-warning rounded-xl px-3 py-3 mb-4">
          <Text className="text-text">Cloud sync isn't configured. Accounts are optional.</Text>
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
        className="bg-surface border border-border rounded-xl px-4 py-3 text-text mb-1"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="At least 8 characters"
        placeholderTextColor="#8aa0c2"
      />
      <Text className="text-muted text-xs mb-4">Minimum 8 characters.</Text>

      {error ? <Text className="text-error mb-3">{error}</Text> : null}
      {info ? (
        <View className="bg-success/15 border border-success rounded-xl px-3 py-3 mb-4">
          <Text className="text-text">{info}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSignUp}
        disabled={busy || !email || !password}
        className={`rounded-xl px-4 py-4 items-center ${busy || !email || !password ? "bg-surface border border-border" : "bg-en"}`}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold">Create account</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace("/login")} className="mt-4 items-center py-2">
        <Text className="text-muted">Already have an account? Sign in</Text>
      </Pressable>
    </Screen>
  );
}
