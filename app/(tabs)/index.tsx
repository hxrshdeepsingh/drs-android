// import React, { useEffect, useRef } from "react";
// import { Accelerometer } from "expo-sensors";
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import dgram from "react-native-udp";
// import { Buffer } from "buffer";

// const SERVER_IP = "10.72.76.43"; // Ensure this matches your PC IP
// const PORT = 9002;

// export default function App() {
//   const socket = useRef<any>(null);
//   const lastSentValue = useRef(0);

//   useEffect(() => {
//     // Initialize UDP Socket
//     socket.current = dgram.createSocket({ type: "udp4" });
//     socket.current.bind(Math.floor(Math.random() * 1000) + 40000);

//     // Set high frequency (8ms = ~125Hz)
//     Accelerometer.setUpdateInterval(8);

//     const subscription = Accelerometer.addListener(({ y }) => {
//       let value = -y * 3.5;
//       value = Math.max(Math.min(value, 1), -1);

//       // Only send if the change is significant to avoid network flooding
//       if (Math.abs(value - lastSentValue.current) > 0.005) {
//         lastSentValue.current = value;
//         sendPacket({ t: "s", v: value }); // 's' for steer
//       }
//     });

//     return () => {
//       subscription.remove();
//       if (socket.current) socket.current.close();
//     };
//   }, []);

//   const sendPacket = (data: object) => {
//     if (!socket.current) return;
//     const message = Buffer.from(JSON.stringify(data));
//     socket.current.send(message, 0, message.length, PORT, SERVER_IP);
//   };

//   const handleBtn = (btn: string, action: "p" | "r") => {
//     sendPacket({ t: "b", v: btn, a: action }); // 'b' for button
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.statusText}>CONTROLLER CONNECTED</Text>
      
//       <View style={styles.buttonGrid}>
//         <Btn title="A" color="#4CAF50" onIn={() => handleBtn("A", "p")} onOut={() => handleBtn("A", "r")} />
//         <Btn title="B" color="#F44336" onIn={() => handleBtn("B", "p")} onOut={() => handleBtn("B", "r")} />
//         <Btn title="LT" color="#333" onIn={() => handleBtn("LT", "p")} onOut={() => handleBtn("LT", "r")} />
//         <Btn title="RT" color="#333" onIn={() => handleBtn("RT", "p")} onOut={() => handleBtn("RT", "r")} />
//       </View>
//     </View>
//   );
// }

// const Btn = ({ title, onIn, onOut, color }: any) => (
//   <TouchableOpacity 
//     activeOpacity={0.6} 
//     onPressIn={onIn} 
//     onPressOut={onOut} 
//     style={[styles.btn, { backgroundColor: color }]}
//   >
//     <Text style={styles.btnText}>{title}</Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
//   statusText: { color: "#444", fontSize: 12, letterSpacing: 2, marginBottom: 40 },
//   buttonGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
//   btn: { width: 80, height: 80, borderRadius: 40, margin: 15, justifyContent: "center", alignItems: "center" },
//   btnText: { color: "#fff", fontWeight: "bold", fontSize: 18 }
// });


import React, { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import dgram from "react-native-udp";
import { Buffer } from "buffer";

const SERVER_IP = "10.72.76.209"; 
const PORT = 9002;

export default function App() {
  const socket = useRef<any>(null);
  const lastSentValue = useRef(0);
  const offset = useRef(0); // For calibration

  useEffect(() => {
    socket.current = dgram.createSocket({ type: "udp4" });
    socket.current.bind(Math.floor(Math.random() * 1000) + 40000);

    // Increase frequency: 5ms = 200Hz for ultra-smooth center response
    Accelerometer.setUpdateInterval(5);

    const subscription = Accelerometer.addListener(({ y }) => {
      // 1. Apply calibration offset
      let rawY = -y - offset.current;

      // 2. Center-Agile Curve (Power < 1.0)
      // This makes the center "snappy" and removes that numb feeling
      let steer = Math.sign(rawY) * Math.pow(Math.abs(rawY), 0.45);

      // 3. High Sensitivity Multiplier
      steer = steer * 1.5; 

      // 4. Clamp
      steer = Math.max(Math.min(steer, 1), -1);

      // 5. Lower threshold (0.001) ensures the PC sees even the tiny wobbles
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

  const calibrate = () => {
    // Set the current physical position as the new "Zero"
    Accelerometer.getCurrentPermissionsAsync().then(() => {
      const sub = Accelerometer.addListener(({ y }) => {
        offset.current = -y;
        sub.remove();
        console.log("Calibrated to:", offset.current);
      });
    });
  };

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
      <TouchableOpacity onPress={calibrate} style={styles.calibrateBtn}>
        <Text style={styles.calibrateText}>TAP TO CENTER WHEEL</Text>
      </TouchableOpacity>
      
      <View style={styles.buttonGrid}>
        <Btn title="A" color="#4CAF50" onIn={() => handleBtn("A", "p")} onOut={() => handleBtn("A", "r")} />
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
  calibrateBtn: { marginBottom: 60, padding: 15, borderWidth: 1, borderColor: "#444", borderRadius: 10 },
  calibrateText: { color: "#888", fontSize: 12, letterSpacing: 2 },
  buttonGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  btn: { width: 80, height: 80, borderRadius: 40, margin: 15, justifyContent: "center", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 18 }
});