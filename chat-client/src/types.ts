export enum MessageType {
    WELCOME = "welcome",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_MESSAGE = "user_message",
    ERROR = "error"
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
