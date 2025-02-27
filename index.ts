import type { Server, ServerWebSocket } from "bun";
import type { RouterInterface } from "./router";
import type {
    RedisClientType,
    RedisFunctions,
    RedisModules,
    RedisScripts,
} from "@redis/client";
import { createClient } from "@redis/client";
import router from "./router";

type WebSocketWithData = ServerWebSocket<{
    userId: string;
    username: string;
}>;

interface Client {
    id: string;
    username: string;
    socket: WebSocketWithData;
}

enum MessageType {
    WELCOME = "welcome",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_MESSAGE = "user_message",
    ERROR = "error",
}

interface Message {
    type: MessageType;
    username: string;
    userId?: string;
    senderId?: string;
    message?: string;
}

const store = createClient({
    url: import.meta.env.REDIS_URL,
});

class WebSocketServer {
    private clients: Map<string, Client> = new Map();
    private server: Server;

    constructor(
        router: RouterInterface,
        store: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
    ) {
        this.server = Bun.serve({
            port: String(process.env.PORT || 8080),
            fetch: async (req, server): Promise<Response | undefined> => {
                return router.serve(req, server, store);
            },
            websocket: {
                maxPayloadLength: 1024 * 1024,
                open: this.handleConnection,
                message: this.handleMessage,
                close: this.handleDisconnection,
            },
        });

        console.log(`WebSocket server running at... ${this.server.url}`);
    }

    private broadcast = (data: Message): void => {
        for (const { 1: client } of this.clients.entries()) {
            if (data.senderId && client.id === data.senderId) continue;

            client.socket.send(
                JSON.stringify({
                    type: data.type,
                    id: crypto.randomUUID(),
                    connectedClients: this.clients.size,
                    message: data.message,
                    sentByCurrentUser: client.id === data.userId,
                    timestamp: new Date().toISOString(),
                    username: data.username,
                }),
            );
        }
    };

    private relayMessage(
        ws: WebSocketWithData,
        data: {
            type: MessageType;
            error?: string;
        },
    ): void {
        ws.send(
            JSON.stringify({
                type: data.type,
                id: crypto.randomUUID(),
                connectedClients: this.clients.size,
                error: data.error,
                sentByCurrentUser: data.type === MessageType.USER_MESSAGE,
                timestamp: new Date().toISOString(),
                username: ws.data.username,
            }),
        );
    }

    private handleConnection = (ws: WebSocketWithData): void => {
        const { userId, username } = ws.data;

        console.log(`Client connected: ${userId}`);

        if (this.clients.has(userId)) {
            console.log(`Client ${userId} already connected. Reconnecting.`);
        }

        this.clients.set(userId, { id: userId, username, socket: ws });

        this.relayMessage(ws, { type: MessageType.WELCOME });

        this.broadcast({
            type: MessageType.USER_JOINED,
            senderId: userId,
            username,
        });
    };

    private handleMessage = (ws: WebSocketWithData, message: string): void => {
        try {
            if (!message) throw Error("You must provide a message!");

            this.broadcast({
                ...ws.data,
                type: MessageType.USER_MESSAGE,
                message,
            });
        } catch (error) {
            console.error(`Error parsing message: `, error);
            this.relayMessage(ws, {
                type: MessageType.ERROR,
                error: (error as Error)?.message,
            });
        }
    };

    private handleDisconnection = async (
        ws: WebSocketWithData,
    ): Promise<void> => {
        const { userId, username } = ws.data;

        this.clients.delete(userId);

        console.log(`Client diconnected: ${userId}`);

        this.broadcast({
            type: MessageType.USER_LEFT,
            username,
        });
    };
}

(async () => {
    try {
        await store.connect();
        console.log("Connected to redis store!");

        new WebSocketServer(router, store);
    } catch (error) {
        if (store.isOpen) {
            store.quit();
        }
        console.error(error);
        process.exit(1);
    }
})();
