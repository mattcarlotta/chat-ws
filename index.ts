import type { Server, ServerWebSocket } from "bun";
import cookie from "cookie";

type WebSocketWithData = ServerWebSocket<{
    clientId: string;
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
    MESSAGE = "message",
    ERROR = "error",
}

interface Message {
    type: MessageType;
    username: string;
    clientId?: string;
    message?: string;
}

class WebSocketServer {
    private clients: Map<string, Client> = new Map();
    private server: Server;

    constructor() {
        this.server = Bun.serve({
            port: String(process.env.PORT || 8080),
            fetch: (req, server): Response | undefined => {
                const { clientId, username } = this.parseCookie(req);

                if (!username) {
                    return new Response(
                        "You must sign in with a username before you can chat!",
                        {
                            status: 403,
                        },
                    );
                }

                const upgraded = server.upgrade(req, {
                    headers: {
                        "Set-Cookie": `clientId=${clientId}; username=${username}; domain="localhost"; max-age=2592000`,
                    },
                    data: { clientId, username },
                });

                if (upgraded) return;

                return new Response("Upgrade failed - Websocket server only", {
                    status: 500,
                });
            },
            websocket: {
                maxPayloadLength: 1024 * 1024,
                open: this.handleConnection,
                message: this.handleMessage,
                close: this.handleDisconnection,
            },
        });

        console.log(
            `WebSocket server running on port: ${this.server.hostname}:${this.server.port}`,
        );
    }

    private parseCookie(req: Request): {
        clientId: string;
        username: string | null;
    } {
        const parsedCookie = cookie.parse(req.headers.get("Cookie") || "");

        return {
            clientId: parsedCookie.clientId || crypto.randomUUID(),
            username: parsedCookie.username || req.headers.get("username"),
        };
    }

    private broadcast = (senderId: string | null, data: Message): void => {
        this.clients.forEach((client) => {
            if (senderId === null || client.id !== senderId) {
                client.socket.send(
                    JSON.stringify({
                        type: data.type,
                        id: crypto.randomUUID(),
                        connectedClients: this.clients.size,
                        message: data.message,
                        sentByCurrentUser: client.id === data.clientId,
                        timestamp: new Date().toISOString(),
                        username: data.username,
                    }),
                );
            }
        });
    };

    private relayMessage(
        ws: WebSocketWithData,
        type: MessageType,
        message: string,
    ): void {
        ws.send(
            JSON.stringify({
                type,
                id: crypto.randomUUID(),
                connectedClients: this.clients.size,
                message,
                timestamp: new Date().toISOString(),
                username: ws.data.username,
                sentBy: type === MessageType.MESSAGE ? "user" : "system",
            }),
        );
    }

    private handleConnection = (ws: WebSocketWithData): void => {
        const { clientId, username } = ws.data;

        console.log(`Client connected: ${clientId}`);

        if (this.clients.has(clientId)) {
            console.log(`Client ${clientId} already connected. Reconnecting.`);
        }

        this.clients.set(clientId, { id: clientId, username, socket: ws });

        this.relayMessage(ws, MessageType.WELCOME, `Welcome ${username}`);

        this.broadcast(clientId, {
            type: MessageType.USER_JOINED,
            username,
        });
    };

    private handleMessage = (ws: WebSocketWithData, message: string): void => {
        const { clientId, username } = ws.data;
        try {
            if (!message) return;

            this.broadcast(null, {
                type: MessageType.MESSAGE,
                clientId,
                message,
                username,
            });
        } catch (error) {
            console.error(`Error parsing message: `, error);
            this.relayMessage(ws, MessageType.ERROR, "Invalid message");
        }
    };

    private handleDisconnection = (ws: WebSocketWithData): void => {
        const { clientId, username } = ws.data;

        this.clients.delete(clientId);

        console.log(`Client diconnected: ${clientId}`);

        this.broadcast(null, {
            type: MessageType.USER_LEFT,
            username,
        });
    };
}

new WebSocketServer();
