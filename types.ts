import type { Database } from "bun:sqlite";
import type { Server, ServerWebSocket } from "bun";
import type {
    RedisClientType,
    RedisFunctions,
    RedisModules,
    RedisScripts,
} from "@redis/client";

export type { Server, Database };

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
    created_at: string;
}
