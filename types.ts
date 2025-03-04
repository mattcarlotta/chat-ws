import type { Database } from "bun:sqlite";
import type { Server, ServerWebSocket } from "bun";
import type {
    RedisClientType,
    RedisFunctions,
    RedisModules,
    RedisScripts,
} from "@redis/client";

export type { Server, Database };

export interface DBConnectionI {
    findUserById(id: string): User | null;
    findUserByEmail(email: string): User | null;
    createUser(username: string, password: string, email: string): Promise<User>;
    findUser(email: string, password: string): Promise<User | null>;
    getUserById(id: string): User | null;
    saveMessage(userId: string, message: string): Message;
    getMessageById(messageId: string): Message | null;
    getAllMessages(userId: string): Message[];
    close(): void;
}

export type RedisStore = RedisClientType<
    RedisModules,
    RedisFunctions,
    RedisScripts
>;

export interface Req extends Request {
    URL: URL;
}

export enum Method {
    ALL = "ALL",
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    OPTIONS = "OPTIONS",
    HEAD = "HEAD",
}

export type WebSocketWithData = ServerWebSocket<{
    userId: string;
    username: string;
}>;

export interface Client {
    id: string;
    username: string;
    socket: WebSocketWithData;
}

export enum MessageType {
    WELCOME = "welcome",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_MESSAGE = "user_message",
    ERROR = "error",
}

export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    created_at: string;
}

export interface Message {
    id: string;
    type: MessageType;
    username: string;
    userId?: string;
    senderId?: string;
    message?: string;
    createdAt: string;
}
