import type { ReactNode } from "react";
import type { Message } from "./types";
import Cookie from "js-cookie";
import { useEffect, useState } from "react";
import { ConnectionStatus } from "./types";
import { WebSocketContext } from "./useWebSocketContext";

export default function DBProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.UNAUTHED);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const connectToChat = () => {
            const socket = new WebSocket(`ws://${import.meta.env.VITE_HOST_URL}/chat?token=${Cookie.get("token")}`);

            socket.onopen = () => {
                console.log("Connected to chat server...");
                setConnectionStatus(ConnectionStatus.CONNECTED);
            };

            socket.onmessage = (event) => {
                try {
                    const data: Message = JSON.parse(event.data);
                    const initMessages = data.messages || [];

                    setOnlineUsers(data.connectedClients);
                    setMessages((prevMess) => [...prevMess, ...initMessages, data]);
                } catch (error) {
                    setError((error as Error)?.message);
                    setConnectionStatus(ConnectionStatus.ERROR);
                }
            };

            socket.onerror = (error) => {
                console.error(`Chat server encountered an error: ${error}`);
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
                setMessages,
                setError,
                socket
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
