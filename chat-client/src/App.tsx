import type { ChangeEvent, FormEvent } from "react";
import type { Message } from "./types";
import { useEffect, useRef, useState } from "react";
import Cookie from "js-cookie";
import Chat from "./Chat";
import ConnectionError from "./ConnectionError";
import LoginForm from "./LoginForm";
import ChatBox from "./ChatBox";
import SendChatMessageForm from "./SendChatMessageForm";

enum ConnectionStatus {
    CONNECTING,
    CONNECTED,
    ERROR,
    UNAUTHED
}

function App() {
    const socketRef = useRef<WebSocket | null>(null);
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.CONNECTING);
    const [userId, setUserId] = useState("");
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!username.length) return;

        setConnectionStatus(ConnectionStatus.CONNECTING);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleDisconnect = () => {
        socketRef.current?.close();
    };

    const handleChatSubmit = (message: string) => {
        socketRef.current?.send(message);
    };

    useEffect(() => {
        const connectToChat = () => {
            const socket = new WebSocket(`ws://localhost:8080?clientId=${userId}&username=${username}`);

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
                setUsername("");
                setUserId("");
                setMessages([]);
            };

            socketRef.current = socket;
        };

        if (connectionStatus === ConnectionStatus.CONNECTING && username) connectToChat();
    }, [username, userId, connectionStatus]);

    useEffect(() => {
        const clientId = Cookie.get("clientId") || "";
        const username = Cookie.get("username") || "";

        setUsername(username);
        setUserId(clientId);

        setConnectionStatus(clientId && username ? ConnectionStatus.CONNECTING : ConnectionStatus.UNAUTHED);

        return () => {
            socketRef.current?.close();
        };
    }, []);

    return (
        <>
            {
                {
                    [ConnectionStatus.CONNECTING]: (
                        <Chat>
                            <div className="h-[calc(100%-81px)] flex justify-center items-center">
                                <p>Loading...</p>
                            </div>
                        </Chat>
                    ),
                    [ConnectionStatus.CONNECTED]: (
                        <>
                            <ChatBox onDisconnect={handleDisconnect} messages={messages} onlineUsers={onlineUsers} />
                            <SendChatMessageForm onChatSubmit={handleChatSubmit} />
                        </>
                    ),
                    [ConnectionStatus.ERROR]: <ConnectionError error={error} />,
                    [ConnectionStatus.UNAUTHED]: (
                        <LoginForm onInputChange={handleInputChange} onSubmit={handleSubmit} username={username} />
                    )
                }[connectionStatus]
            }
        </>
    );
}

export default App;
