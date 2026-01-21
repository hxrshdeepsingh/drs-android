import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  input: {
    width: 300,
    backgroundColor: "#111",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  connectBtn: {
    width: 300,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    margin: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  panel: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  title: { color: "#fff", fontWeight: "800", marginBottom: 10, fontSize: 16 }
});
