import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import dgram from "react-native-udp";
import { Buffer } from "buffer";

const SERVER_IP = "192.168.1.8"; 
const PORT = 9002;

export default function App() {
  const socket = useRef<any>(null);
  const lastSentValue = useRef(0);
  const offset = useRef(0);

  useEffect(() => {
    socket.current = dgram.createSocket({ type: "udp4" });
    socket.current.bind(Math.floor(Math.random() * 1000) + 40000);
    Accelerometer.setUpdateInterval(5);
    const subscription = Accelerometer.addListener(({ y }) => {
      let rawY = -y - offset.current;
      let steer = Math.sign(rawY) * Math.pow(Math.abs(rawY), 0.45);
      steer = steer * 1.5; 
      steer = Math.max(Math.min(steer, 1), -1);
      if (Math.abs(steer - lastSentValue.current) > 0.001) {
        lastSentValue.current = steer;
        sendPacket({ t: "s", v: steer });
      }
    });

    return () => {
      subscription.remove();
      if (socket.current) socket.current.close();
    };
  }, []);

  const sendPacket = (data: object) => {
    if (!socket.current) return;
    const message = Buffer.from(JSON.stringify(data));
    socket.current.send(message, 0, message.length, PORT, SERVER_IP);
  };

  const handleBtn = (btn: string, action: "p" | "r") => {
    sendPacket({ t: "b", v: btn, a: action });
  };

  return (
    <View style={styles.container}>      
      <View style={styles.buttonGrid}>
        <Btn title="A#" color="#4CAF50" onIn={() => handleBtn("A", "p")} onOut={() => handleBtn("A", "r")} />
        <Btn title="B" color="#F44336" onIn={() => handleBtn("B", "p")} onOut={() => handleBtn("B", "r")} />
        <Btn title="LT" color="#333" onIn={() => handleBtn("LT", "p")} onOut={() => handleBtn("LT", "r")} />
        <Btn title="RT" color="#333" onIn={() => handleBtn("RT", "p")} onOut={() => handleBtn("RT", "r")} />
      </View>
    </View>
  );
}

const Btn = ({ title, onIn, onOut, color }: any) => (
  <TouchableOpacity 
    activeOpacity={0.6} 
    onPressIn={onIn} 
    onPressOut={onOut} 
    style={[styles.btn, { backgroundColor: color }]}
  >
    <Text style={styles.btnText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  buttonGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  btn: { width: 80, height: 80, borderRadius: 40, margin: 15, justifyContent: "center", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 18 }
});