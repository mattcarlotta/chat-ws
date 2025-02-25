import { FormEvent, useEffect, useRef, useState } from "react";
import Cookie from "js-cookie";

enum MessageType {
    WELCOME = "welcome",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_MESSAGE = "user_message",
    ERROR = "error"
}

interface Message {
    type: MessageType;
    id: string;
    connectedClients: number;
    message?: string;
    sentByCurrentUser: boolean;
    timestamp: string;
    username: string;
}

function App() {
    const socketRef = useRef<WebSocket | null>(null);
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [connected, setConnected] = useState(false);
    const [userId, setUserId] = useState("");
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!username.length) return;

        setIsLoggingIn(true);
    };

    const handleDisconnect = () => {
        socketRef.current?.close();
    };

    useEffect(() => {
        const connectToChat = () => {
            const socket = new WebSocket(`ws://localhost:8080?clientId=${userId}&username=${username}`);

            socket.onopen = () => {
                // Add connection message to chat
                // setMessages(prev => [...prev, {
                //   type: 'system',
                //   message: 'Connected to server'
                // }]);
                setIsLoggingIn(false);
                setConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const message: Message = JSON.parse(event.data);

                    setOnlineUsers(message.connectedClients);
                    setMessages((prevMess) => [...prevMess, message]);
                } catch (error) {
                    setError((error as Error)?.message);
                }

                // Handle different message types
                // if (message.type === MessageType.WELCOME) {
                //   setOnlineUsers(message.connectedClients || 0);
                // } else if (message.type === 'userJoined' || message.type === 'userLeft') {
                //   setOnlineUsers(message.connectedClients || 0);
                // }

                // Add message to chat
                // setMessages(prev => [...prev, message]);
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                // setConnectionStatus('Error: Failed to connect');
                // setMessages(prev => [...prev, {
                //   type: 'error',
                //   message: 'Connection error'
                // }]);
            };

            socket.onclose = () => {
                console.log("Disconnected from WebSocket server");
                setConnected(false);
                setUsername("");
                setUserId("");
                setMessages([]);
                // setConnected(false);
                // setConnectionStatus('Disconnected');
                // setMessages(prev => [...prev, {
                //   type: 'system',
                //   message: 'Disconnected from server'
                // }]);
            };

            socketRef.current = socket;
        };

        if (isLoggingIn) connectToChat();

        /* eslint-disable-next-line */
    }, [isLoggingIn]);

    useEffect(() => {
        const clientId = Cookie.get("clientId");
        const username = Cookie.get("username");

        if (clientId && username) {
            setUsername(username);
            setUserId(clientId);
            setIsLoggingIn(true);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    return (
        <>
            <a
                id="skip-to-content"
                aria-label="Skip to main content"
                className="absolute left-[-9999px] top-4 z-50 rounded p-2 text-center text-white no-underline bg-blue-600 hover:bg-blue-700 hover:shadow-2xl dark:bg-purple-700 dark:hover:bg-purple-900 focus:left-5"
                href="#main"
            >
                Skip to content
            </a>
            <nav className="flex bg-linear-to-r/decreasing from-indigo-500 to-teal-400 text-slate-100 border-b border-gray-400 p-4 shadow-sm dark:bg-gradient-to-r dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 dark:border-gray-700 sm:justify-center sm:items-center">
                <header className="flex flex-1 flex-row items-center space-x-2 md:justify-center" id="navbar">
                    <h1 className="text-3xl font-bold xs:text-4xl">Chat</h1>
                    {/* <SleepIcon className="h-6 w-6" /> */}
                </header>
            </nav>
            <main id="main" className="overflow-y-auto">
                {!connected && !isLoggingIn ? (
                    <form
                        className="h-[calc(100%-81px)] flex flex-col justify-center items-center space-y-4"
                        onSubmit={handleSubmit}
                    >
                        <div>
                            <label>
                                <input
                                    id="username"
                                    className="text-black bg-white w-full py-3.5 pl-3.5 border border-gray-400 rounded"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </label>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="cursor-pointer rounded bg-blue-600 py-2.5 px-24 text-white text-lg font-semibold hover:bg-blue-700 dark:bg-purple-800 dark:hover:bg-purple-900"
                            >
                                Log In
                            </button>
                        </div>
                    </form>
                ) : isLoggingIn ? (
                    <div className="h-[calc(100%-81px)] flex justify-center items-center">
                        <p>Loading...</p>
                    </div>
                ) : error ? (
                    <div className="h-[calc(100%-81px)] flex flex-col items-center justify-center">
                        <div className="p-4 text-gray-600 bg-orange-800/10 border border-orange-300 text-center rounded dark:bg-purple-900/50 dark:border-purple-900">
                            <header id="app-error">
                                <h2 className="text-3xl font-bold text-red-600">
                                    An Error Occurred: Unable to load the app.
                                </h2>
                            </header>
                            <p className="text-xl text-red-600">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[calc(100%-81px)] p-4">
                        <h1>Online: {onlineUsers}</h1>
                        <button
                            className="cursor-pointer p-2 bg-red-500 rounded"
                            type="button"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                        <pre>{JSON.stringify(messages, null, 2)}</pre>
                    </div>
                )}
            </main>
        </>
    );
}

export default App;
