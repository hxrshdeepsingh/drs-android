import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24 }}>Gamepad Page</Text>

      <Button
        title="Go Back"
        onPress={() => router.push("/gamepad")}
      />
    </View>
  );
}
