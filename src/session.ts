import { Buffer } from "buffer";

export const session: any = {
    socket: null,
    ip: "",
    port: 0,
    connected: false,
};

export function sendPacket(data: any) {
    if (!session.connected || !session.socket) return;
    const msg = Buffer.from(JSON.stringify(data));
    session.socket.send(msg, 0, msg.length, session.port, session.ip);
}

export function sendButton(btn: string, action: "p" | "r") {
    sendPacket({ t: "b", v: btn, a: action });
}
