import { View, TouchableOpacity, Text, StatusBar } from "react-native";
import { router } from "expo-router";
import { styles } from "@/src/styles/styles";
import { sendButton, session } from "@/src/session";

const Btn = ({ title, onIn, onOut, color }: any) => (
    <TouchableOpacity onPressIn={onIn} onPressOut={onOut} style={[styles.btn, { backgroundColor: color }]}>
        <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
);

export default function GamepadScreen() {
    if (!session.connected) {
        return (
            <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ color: "#fff" }}>Not connected.</Text>
                <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: "#1b5cff", marginTop: 12 }]}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <View style={styles.buttonGrid}>
                <Btn title="A" color="#4CAF50" onIn={() => sendButton("A", "p")} onOut={() => sendButton("A", "r")} />
                <Btn title="B" color="#F44336" onIn={() => sendButton("B", "p")} onOut={() => sendButton("B", "r")} />
                <Btn title="LT" color="#333" onIn={() => sendButton("LT", "p")} onOut={() => sendButton("LT", "r")} />
                <Btn title="RT" color="#333" onIn={() => sendButton("RT", "p")} onOut={() => sendButton("RT", "r")} />
            </View>
        </View>
    );
}
