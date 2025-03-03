import { createClient } from "@redis/client";
import WebSocketServer from "./websocket";
import routes from "./routes";
import db from "./db";

const store = createClient({ url: Bun.env.REDIS_URL });

const ws = new WebSocketServer(Bun.env.PORT, routes, store, db);

ws.start();

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => {
        console.log(
            `\nReceived ${signal}, closing websocket, redis and sqlite connections...`,
        );
        ws.shutdown();
        process.exit(0);
    });
});
