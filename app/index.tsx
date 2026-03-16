import { useEffect, useRef, useState } from "react";
import { Accelerometer } from "expo-sensors";
import { View, Text, TouchableOpacity, TextInput, StatusBar, UIManager } from "react-native";
import dgram from "react-native-udp";
import { Buffer } from "buffer";
import { styles } from "./styles";
import { Image } from "react-native"
import { Pressable } from "react-native";
(global as any).Buffer = Buffer;

const DISCOVERY_PORT = 9003;

export default function App() {
  const [serverIp, setServerIp] = useState("192.168.1.8");
  const [portText, setPortText] = useState("9002");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const socket = useRef<any>(null);
  const discoverySocket = useRef<any>(null);
  const accelSub = useRef<any>(null);

  const connectedRef = useRef(false);
  const lastFoundIp = useRef("");

  const lastSentValue = useRef(0);
  const offset = useRef(0);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
  }, []);

  const isValidIp = (ip: string) => {
    const parts = ip.trim().split(".");
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      if (p === "" || !/^\d+$/.test(p)) return false;
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  };

  const getPort = () => {
    const p = Number(portText);
    if (!Number.isInteger(p) || p < 1 || p > 65535) return null;
    return p;
  };

  const stopSending = () => {
    try {
      accelSub.current?.remove?.();
    } catch { }
    accelSub.current = null;

    try {
      socket.current?.close?.();
    } catch { }
    socket.current = null;

    connectedRef.current = false;
    setConnected(false);
  };

  const startSendingWith = (ip: string, port: number) => {
    setError("");

    if (!isValidIp(ip)) return setError("Invalid IP address");
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      return setError("Invalid port (1-65535)");

    stopSending();

    socket.current = dgram.createSocket({ type: "udp4" });
    socket.current.bind(Math.floor(Math.random() * 1000) + 40000);

    connectedRef.current = true;
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
        socket.current?.send(msg, 0, msg.length, port, ip);
      }
    });
  };

  const startSending = () => {
    const port = getPort();
    if (!isValidIp(serverIp)) return setError("Invalid IP address");
    if (!port) return setError("Invalid port (1-65535)");
    startSendingWith(serverIp, port);
  };

  const sendPacket = (data: any) => {
    if (!connectedRef.current || !socket.current) return;
    const port = getPort() ?? 9002;
    const msg = Buffer.from(JSON.stringify(data));
    socket.current.send(msg, 0, msg.length, port, serverIp);
  };

  const handleBtn = (btn: string, action: string) => {
    sendPacket({ t: "b", v: btn, a: action });
  };

  const startDiscovery = () => {
    if (discoverySocket.current) return;

    const ds = dgram.createSocket({ type: "udp4" });

    ds.bind(DISCOVERY_PORT, () => {
      try {
        ds.setBroadcast?.(true);
      } catch { }
      console.log("🔎 Discovery listening on", DISCOVERY_PORT);
    });

    ds.on("message", (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data?.app !== "steering") return;

        const ip = rinfo.address;
        const port = Number(data?.port ?? 9002);

        // avoid spam / loops
        if (ip === lastFoundIp.current && connectedRef.current) return;
        lastFoundIp.current = ip;

        console.log("✅ Found PC:", ip, "port:", port);
        setServerIp(ip);
        setPortText(String(port));

        // auto-connect only if not already connected
        if (!connectedRef.current) {
          // give React state a moment to update
          setTimeout(() => startSendingWith(ip, port), 50);
        }
      } catch {
        // ignore
      }
    });

    ds.on("error", (e) => {
      console.log("⚠️ Discovery error", e);
      try { ds.close(); } catch { }
      discoverySocket.current = null;
    });

    discoverySocket.current = ds;
  };

  useEffect(() => {
    startDiscovery();
    return () => {
      stopSending();
      try { discoverySocket.current?.close?.(); } catch { }
      discoverySocket.current = null;
    };
  }, []);

  const renderConnect = () => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />

        <Text style={styles.logoText}>DRSPad</Text>
        <Text style={styles.subText}>Control Like an F1 Driver.</Text>
        {!!error && <Text style={{ color: "#ff5252", marginTop: 16, fontSize: 13, fontWeight: "600" }}>{error}</Text>}
      </View>

      <View style={styles.cardRight}>
        <View style={{ flexDirection: "row", width: "100%" }}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: 16 }]}>
            <Text style={styles.inputLabel}>IP Address</Text>
            <TextInput
              style={styles.input}
              placeholder="192.168.1.x"
              placeholderTextColor="#555"
              value={serverIp}
              onChangeText={setServerIp}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Port</Text>
            <TextInput
              style={styles.input}
              placeholder="9002"
              placeholderTextColor="#555"
              value={portText}
              onChangeText={setPortText}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.connectBtn, { backgroundColor: "#fff" }]}
          onPress={startSending}
        >
          <Text style={styles.connectBtnText}>CONNECT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGamepad = () => (
    <View style={styles.gamepadContainer} pointerEvents="box-none">
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
        <TouchableOpacity style={styles.disconnectBtn} onPress={stopSending}>
          <Text style={styles.disconnectText}>DISCONNECT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsArea}>
        <View style={styles.triggerRow}>
          <TriggerBtn title="LT" onIn={() => handleBtn("LT", "p")} onOut={() => handleBtn("LT", "r")} />
          <TriggerBtn title="RT" onIn={() => handleBtn("RT", "p")} onOut={() => handleBtn("RT", "r")} />
        </View>

        <View style={styles.faceButtonRow}>
          <Btn title="A" color="#00E676" onIn={() => handleBtn("A", "p")} onOut={() => handleBtn("A", "r")} />
          <Btn title="B" color="#FF1744" onIn={() => handleBtn("B", "p")} onOut={() => handleBtn("B", "r")} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {!connected ? renderConnect() : renderGamepad()}
    </View>
  );
}

const Btn = ({ title, onIn, onOut, color }: { title: string, onIn: () => void, onOut: () => void, color: string }) => (
  <Pressable onPressIn={onIn} onPressOut={onOut} style={({ pressed }) => [
    styles.btn,
    { backgroundColor: color, shadowColor: color, opacity: pressed ? 0.8 : 1 }
  ]}>
    <Text style={styles.btnText}>{title}</Text>
  </Pressable>
);

const TriggerBtn = ({ title, onIn, onOut }: { title: string, onIn: () => void, onOut: () => void }) => (
  <Pressable onPressIn={onIn} onPressOut={onOut} style={styles.triggerBtn}>
    <Text style={styles.triggerText}>{title}</Text>
  </Pressable>
);
