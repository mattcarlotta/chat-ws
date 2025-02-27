import type { Server, ServerWebSocket } from "bun";
import jwt from "jsonwebtoken";
import { createClient } from "@redis/client";

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

    constructor() {
        this.server = Bun.serve({
            port: String(process.env.PORT || 8080),
            fetch: async (req, server): Promise<Response | undefined> => {
                const url = new URL(req.url);
                const token = url.searchParams.get("token") || "";

                if (req.method === "OPTIONS") {
                    return new Response(null, {
                        status: 204,
                        headers: this.createHeaders(),
                    });
                }

                if (
                    (url.pathname.includes("assets") || url.pathname.includes("svg")) &&
                    req.method === "GET"
                ) {
                    return new Response(Bun.file(`./chat-client/dist/${url.pathname}`));
                }

                if (url.pathname === "/" && req.method === "GET") {
                    return new Response(Bun.file(`./chat-client/dist/index.html`));
                }

                if (url.pathname === "/" && req.method === "POST") {
                    try {
                        const { username, password } = (await req.json()) as {
                            username: string;
                            password: string;
                        };
                        if (!username || password !== import.meta.env.PASSWORD) {
                            return this.sendError(
                                403,
                                "You must sign in with a username before you can chat!",
                            );
                        }
                        const userId = crypto.randomUUID();
                        await store.set(userId, username, {
                            EX: 2592000,
                        });

                        const token = jwt.sign({ userId }, import.meta.env.JWT_SECRET);
                        const headers = this.createHeaders({ token });

                        headers.set("Content-Type", "application/json");

                        return new Response(token, {
                            headers,
                            status: 200,
                        });
                    } catch (error) {
                        return this.sendError(400, (error as Error)?.message);
                    }
                }

                if (url.pathname === "/chat" && req.method === "GET") {
                    try {
                        if (!token) {
                            throw Error("User attempted to connect with an empty token.");
                        }
                        const { userId } = jwt.verify(token, import.meta.env.JWT_SECRET, {
                            maxAge: 2592000,
                        }) as {
                            userId: string;
                        };

                        const username = await store.get(userId || "");
                        if (!username) {
                            throw Error("User attempted to connect with an invalid token.");
                        }

                        const upgraded = server.upgrade(req, {
                            data: { userId, username },
                        });

                        if (upgraded) return;

                        return this.sendError(
                            500,
                            "Upgrade failed - Websocket server only",
                        );
                    } catch (error) {
                        console.log(error);
                        return this.sendError(403, "Invalid token!");
                    }
                }

                return this.sendError(404, "Route not found!");
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

    private createHeaders({
        token,
        clearToken,
    }: { token?: string; clearToken?: boolean } = {}): Headers {
        const headers = new Headers();

        if (token) {
            headers.set("Set-Cookie", `token=${token}; path=/; MaxAge=2592000`);
        }

        if (clearToken) {
            headers.set("Set-Cookie", `token=; path=/; MaxAge=0`);
        }

        headers.set("Access-Control-Allow-Origin", "*");
        headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
        );
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.set("Access-Control-Max-Age", "86400");

        return headers;
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

    private sendError(status: number, err: string): Response {
        console.error(err);
        return new Response(err, {
            status,
            headers: this.createHeaders({ clearToken: true }),
        });
    }

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
        // await store.del(userId);

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

        new WebSocketServer();
    } catch (error) {
        if (store.isOpen) {
            store.quit();
        }
        console.error(error);
        process.exit(1);
    }
})();
