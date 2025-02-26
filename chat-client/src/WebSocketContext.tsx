import type { Message } from "./types";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Cookie from "js-cookie";
import { v4 as uuid } from "uuid";
import { WebSocketContext } from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

export default function DBProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.CONNECTING);
    const [userId, setUserId] = useState("");
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const connectToChat = () => {
            const socket = new WebSocket(
                `ws://${import.meta.env.VITE_HOST_URL}?clientId=${userId}&username=${username}`
            );

            socket.onopen = () => {
                if (!Cookie.get("clientId"))
                    Cookie.set("clientId", userId, { expires: 2592000, path: "/", sameSite: "Strict" });
                if (!Cookie.get("username"))
                    Cookie.set("username", username, { expires: 2592000, path: "/", sameSite: "Strict" });
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
                setUsername("");
                setUserId("");
                setMessages([]);
            };

            setSocket(socket);
        };

        if (connectionStatus === ConnectionStatus.CONNECTING && username) connectToChat();
    }, [username, userId, connectionStatus]);

    useEffect(() => {
        const clientId = Cookie.get("clientId") || uuid();
        const username = Cookie.get("username") || "";

        setUsername(username);
        setUserId(clientId);

        setConnectionStatus(clientId && username ? ConnectionStatus.CONNECTING : ConnectionStatus.UNAUTHED);

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
                setUsername,
                socket,
                username
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
