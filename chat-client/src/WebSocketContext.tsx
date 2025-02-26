import type { Message } from "./types";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Cookie from "js-cookie";
import { WebSocketContext } from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

export default function DBProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.UNAUTHED);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const connectToChat = () => {
            const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST_URL}?token=${Cookie.get("token")}`);

            socket.onopen = () => {
                setConnectionStatus(ConnectionStatus.CONNECTED);
            };

            socket.onmessage = (event) => {
                try {
                    const message: Message = JSON.parse(event.data);

                    setOnlineUsers(message.connectedClients);
                    setMessages((prevMess) => [...prevMess, message]);
                } catch (error) {
                    setError((error as Error)?.message);
                    setConnectionStatus(ConnectionStatus.ERROR);
                }
            };

            socket.onerror = (error) => {
                console.error(`Chat error: ${error}`);
                setError(`Chat error: ${error}`);
                setConnectionStatus(ConnectionStatus.ERROR);
            };

            socket.onclose = () => {
                console.log("Disconnected from chat server...");
                setConnectionStatus(ConnectionStatus.UNAUTHED);
                setMessages([]);
            };

            setSocket(socket);
        };

        if (connectionStatus === ConnectionStatus.CONNECTING) connectToChat();
    }, [connectionStatus]);

    useEffect(() => {
        setConnectionStatus(Cookie.get("token") ? ConnectionStatus.CONNECTING : ConnectionStatus.UNAUTHED);

        return () => {
            socket?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <WebSocketContext.Provider
            value={{
                connectionStatus,
                error,
                messages,
                onlineUsers,
                setConnectionStatus,
                socket
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
