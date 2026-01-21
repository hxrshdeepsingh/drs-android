import { useEffect, useRef, useState } from "react";
import { Accelerometer } from "expo-sensors";
import { View, Text, TouchableOpacity, TextInput, StatusBar, UIManager } from "react-native";
import dgram from "react-native-udp";
import { Buffer } from "buffer";
import { styles } from "./styles";

export default function App() {
    const [serverIp, setServerIp] = useState("192.168.1.8");
    const [portText, setPortText] = useState("9002");
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");

    const socket = useRef(null);
    const accelSub = useRef(null);

    const connectedRef = useRef(false);

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

    const startSendingWith = (ip: any, port: any) => {
        setError("");

        if (!isValidIp(ip)) return setError("Invalid IP address");
        if (!Number.isInteger(port) || port < 1 || port > 65535)
            return setError("Invalid port (1-65535)");

        // reset previous session
        stopSending();

        // Create UDP socket
        socket.current = dgram.createSocket({ type: "udp4" });
        socket.current.bind(Math.floor(Math.random() * 1000) + 40000);

        connectedRef.current = true;
        setConnected(true);

        // start accelerometer stream
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

    const handleBtn = (btn: any, action: any) => {
        sendPacket({ t: "b", v: btn, a: action });
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

            <TextInput
                style={styles.input}
                placeholder="Port"
                placeholderTextColor="#666"
                value={portText}
                onChangeText={setPortText}
                keyboardType="numeric"
                editable={!connected}
            />

            {!!error && <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>}

            <TouchableOpacity
                style={[
                    styles.connectBtn,
                    { backgroundColor: connected ? "#444" : "#1b5cff" },
                ]}
                onPress={connected ? stopSending : startSending}
            >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                    {connected ? "DISCONNECT" : "CONNECT"}
                </Text>
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
    <TouchableOpacity onPressIn={onIn} onPressOut={onOut} style={[styles.btn, { backgroundColor: color }]}>
        <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
);
