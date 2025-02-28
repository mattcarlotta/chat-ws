import type {
    Client,
    Message,
    RedisStore,
    Req,
    Server,
    WebSocketWithData,
} from "./types";
import type { RouterI } from "./router";
import { MessageType } from "./types";

export interface WebSocketServerI {
    start(): Promise<void>;
}

export default class WebSocketServer implements WebSocketServerI {
    private clients: Map<string, Client> = new Map();
    private server: Server | null;
    private router: RouterI;
    private store: RedisStore;
    private port: string;

    constructor(port = "8080", router: RouterI, store: RedisStore) {
        this.router = router;
        this.store = store;
        this.port = port;
        this.server = null;
    }

    public start = async (): Promise<void> => {
        try {
            await this.store.connect();
            console.log(`Connected to redis store... `);

            this.server = Bun.serve({
                port: this.port,
                fetch: (req, server) =>
                    this.router.serve(req as Req, server, this.store),
                websocket: {
                    maxPayloadLength: 1024 * 1024,
                    open: this.handleConnection,
                    message: this.handleMessage,
                    close: this.handleDisconnection,
                },
            });

            console.log(`WebSocket server running at... ${this.server.url}`);
        } catch (error) {
            if (this.store.isOpen) {
                this.store.quit();
            }
            console.error(error);
            process.exit(1);
        }
    };

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

    private handleDisconnection = (ws: WebSocketWithData): void => {
        const { userId, username } = ws.data;

        this.clients.delete(userId);

        console.log(`Client diconnected: ${userId}`);

        this.broadcast({
            type: MessageType.USER_LEFT,
            username,
        });
    };
}
