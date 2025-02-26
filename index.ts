import type { Server, ServerWebSocket } from "bun";

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
    USER_MESSAGE = "user_message",
    ERROR = "error",
}

interface Message {
    type: MessageType;
    username: string;
    clientId?: string;
    senderId?: string;
    message?: string;
}

class WebSocketServer {
    private clients: Map<string, Client> = new Map();
    private server: Server;

    constructor() {
        this.server = Bun.serve({
            port: String(process.env.PORT || 8080),
            fetch: (req, server): Response | undefined => {
                const url = new URL(req.url);
                const clientId = url.searchParams.get("clientId");
                const username = url.searchParams.get("username");

                if (!username || !clientId) {
                    return new Response(
                        "You must sign in with a username before you can chat!",
                        {
                            status: 403,
                        },
                    );
                }

                const upgraded = server.upgrade(req, {
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

    private broadcast = (data: Message): void => {
        for (const { 1: client } of this.clients.entries()) {
            if (data.senderId && client.id === data.senderId) continue;

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
        const { clientId, username } = ws.data;

        console.log(`Client connected: ${clientId}`);

        if (this.clients.has(clientId)) {
            console.log(`Client ${clientId} already connected. Reconnecting.`);
        }

        this.clients.set(clientId, { id: clientId, username, socket: ws });

        this.relayMessage(ws, { type: MessageType.WELCOME });

        this.broadcast({
            type: MessageType.USER_JOINED,
            senderId: clientId,
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

    private handleDisconnection = (ws: WebSocketWithData): void => {
        const { clientId, username } = ws.data;

        this.clients.delete(clientId);

        console.log(`Client diconnected: ${clientId}`);

        this.broadcast({
            type: MessageType.USER_LEFT,
            username,
        });
    };
}

new WebSocketServer();
