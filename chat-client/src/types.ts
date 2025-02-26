export enum MessageType {
    WELCOME = "welcome",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_MESSAGE = "user_message",
    ERROR = "error"
}

export enum ConnectionStatus {
    CONNECTING,
    CONNECTED,
    ERROR,
    UNAUTHED
}

export interface Message {
    type: MessageType;
    id: string;
    connectedClients: number;
    message?: string;
    sentByCurrentUser: boolean;
    timestamp: string;
    username: string;
}

export interface WebSocketContextT {
    connectionStatus: ConnectionStatus;
    error: string;
    messages: Message[];
    onlineUsers: number;
    setConnectionStatus: (s: ConnectionStatus) => void;
    setUsername: (u: string) => void;
    socket: WebSocket | null;
    username: string;
}
