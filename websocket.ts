import type {
    Client,
    DBConnectionI,
    Message,
    RedisStore,
    Server,
    WebSocketWithData,
} from "./types";
import type { RouterI } from "./router";
import { MessageType } from "./types";
import { randomUUIDv7 } from "bun";
import { AuthValidationError, ValidationError } from "./errors";

export interface WebSocketServerI {
    start(): Promise<void>;
    shutdown(): void;
}

export default class WebSocketServer implements WebSocketServerI {
    private clients: Map<string, Client> = new Map();
    private server: Server | null;
    private router: RouterI;
    private store: RedisStore;
    private port: string;
    private db: DBConnectionI;

    constructor(
        port = "8080",
        router: RouterI,
        store: RedisStore,
        db: DBConnectionI,
    ) {
        this.router = router;
        this.store = store;
        this.port = port;
        this.server = null;
        this.db = db;
        addEventListener(
            "logout-disconnect",
            this.handleLogoutDisconnection as EventListener,
        );
    }

    public start = async (): Promise<void> => {
        try {
            await this.store.connect();
            console.log(`Connected to redis store... `);

            this.server = Bun.serve({
                port: this.port,
                fetch: (req, server) =>
                    this.router.serve(req, server, this.store, this.db),
                websocket: {
                    maxPayloadLength: 1024 * 1024,
                    open: this.handleConnection,
                    message: this.handleMessage,
                    close: this.handleDisconnection,
                },
            });

            console.log(
                `Started a web socket server running at... ${this.server.url}`,
            );
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    };

    private handleLogoutDisconnection = (
        e: CustomEvent<{ userId: string }>,
    ): void => {
        const connection = this.clients.get(e.detail.userId);
        if (!connection) return;

        connection.socket.close();
    };

    public shutdown = () => {
        if (this.server) {
            this.server.stop();
        }

        if (this.store.isOpen) {
            this.store.quit();
        }

        this.db.close();

        removeEventListener(
            "logout-disconnect",
            this.handleLogoutDisconnection as EventListener,
        );
    };

    private broadcast = (data: Partial<Message>): void => {
        for (const { 1: client } of this.clients.entries()) {
            if (data.senderId && client.id === data.senderId) continue;

            client.socket.send(
                JSON.stringify({
                    type: data.type,
                    id: randomUUIDv7(),
                    connectedClients: this.clients.size,
                    message: data.message,
                    sentByCurrentUser: client.id === data.userId,
                    createdAt: data.createdAt || new Date().toISOString(),
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
            messages?: Message[];
        },
    ): void {
        ws.send(
            JSON.stringify({
                type: data.type,
                id: randomUUIDv7(),
                connectedClients: this.clients.size,
                error: data.error,
                sentByCurrentUser: data.type === MessageType.USER_MESSAGE,
                messages: data.messages,
                createdAt: new Date().toISOString(),
                username: ws.data.username,
            }),
        );
    }

    private handleConnection = (ws: WebSocketWithData): void => {
        const { userId, username } = ws.data;

        const messages = this.db.getAllMessages(userId);

        const clientConnection = this.clients.get(userId);
        if (clientConnection) {
            console.log(
                `Client ${clientConnection.id} already connected. Disconnecting old connection...`,
            );
            clientConnection.socket.close();
            this.clients.delete(userId);
        }

        console.log(`Client connected: ${userId}`);

        this.clients.set(userId, { id: userId, username, socket: ws });

        this.relayMessage(ws, { type: MessageType.WELCOME, messages });

        this.broadcast({
            type: MessageType.USER_JOINED,
            senderId: userId,
            username,
        });
    };

    private handleMessage = (ws: WebSocketWithData, message: string): void => {
        try {
            const { userId } = ws.data;
            if (!message) {
                throw new ValidationError("You must provide a message!");
            }

            const user = this.store.get(userId);
            if (!user) {
                throw new AuthValidationError(
                    "You must be logged in to send a message!",
                );
            }

            const savedMessage = this.db.saveMessage(userId, message);
            this.broadcast({
                type: savedMessage.type,
                id: savedMessage.id,
                userId: userId,
                message,
                createdAt: savedMessage.createdAt,
                username: savedMessage.username,
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
