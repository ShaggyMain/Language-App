import { Stack } from "expo-router";

export default function LanguageLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b1220" },
        headerTintColor: "#e6ecf5",
        contentStyle: { backgroundColor: "#0b1220" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="path/index" options={{ title: "Path" }} />
      <Stack.Screen name="path/[lessonId]" options={{ title: "Lesson" }} />
      <Stack.Screen name="study/index" options={{ title: "Study" }} />
      <Stack.Screen name="study/[topicId]" options={{ title: "Topic" }} />
      <Stack.Screen name="practice/index" options={{ title: "Practice" }} />
      <Stack.Screen name="practice/[topicId]" options={{ title: "Practice" }} />
      <Stack.Screen name="results" options={{ title: "Results" }} />
    </Stack>
  );
}
