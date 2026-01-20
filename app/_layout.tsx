import { Stack } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";

export default function RootLayout() {
  useKeepAwake();
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
  );
}
