import { useRef, useState } from "react";
import { Accelerometer } from "expo-sensors";
import { View, Text, TouchableOpacity, TextInput, StatusBar } from "react-native";
import { router } from "expo-router";
import dgram from "react-native-udp";
import { Buffer } from "buffer";
import { styles } from "@/src/styles/styles";
import { session } from "@/src/session";
import { isValidIp } from "@/src/logic";

export default function HomeScreen() {
  const [serverIp, setServerIp] = useState("192.168.1.8");
  const [port, setPort] = useState(9002);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const socket = useRef<any>(null);
  const accelSub = useRef<any>(null);
  const lastSentValue = useRef(0);
  const offset = useRef(0);

  const stopSending = () => {
    try { accelSub.current?.remove?.(); } catch { }
    accelSub.current = null;

    try { socket.current?.close?.(); } catch { }
    socket.current = null;

    session.socket = null;
    session.connected = false;
    session.ip = "";
    session.port = 0;

    setConnected(false);
  };

  const startSending = () => {
    setError("");

    if (!isValidIp(serverIp)) return setError("Invalid IP address");

    stopSending();

    const s = dgram.createSocket({ type: "udp4" });
    s.bind(Math.floor(Math.random() * 1000) + 40000);
    socket.current = s;

    session.socket = s;
    session.connected = true;
    session.ip = serverIp;
    session.port = port;

    setConnected(true);

    Accelerometer.setUpdateInterval(5);
    accelSub.current = Accelerometer.addListener(({ y }) => {
      let rawY = -y - offset.current;
      let steer = Math.sign(rawY) * Math.pow(Math.abs(rawY), 0.45);
      steer = steer * 1.5;
      steer = Math.max(Math.min(steer, 1), -1);

      if (Math.abs(steer - lastSentValue.current) > 0.001) {
        lastSentValue.current = steer;
        const msg = Buffer.from(JSON.stringify({ t: "s", v: steer }));
        s.send(msg, 0, msg.length, port, serverIp);
      }
    });

    router.push("/gamepad");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <TextInput
        style={styles.input}
        placeholder="Enter IP"
        placeholderTextColor="#666"
        value={serverIp}
        onChangeText={setServerIp}
        editable={!connected}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {!!error && <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>}

      <TouchableOpacity
        style={[styles.connectBtn, { backgroundColor: connected ? "#444" : "#1b5cff" }]}
        onPress={connected ? stopSending : startSending}
      >
        <Text style={{ color: "#fff", fontWeight: "900" }}>
          {connected ? "DISCONNECT" : "CONNECT"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
