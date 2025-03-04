import { createClient } from "@redis/client";
import WebSocketServer from "./websocket";
import routes from "./routes";
import DBConnection from "./db";

const store = createClient({ url: Bun.env.REDIS_URL });
const db = new DBConnection(String(Bun.env.DB_FILE_PATH));

const ws = new WebSocketServer(Bun.env.PORT, routes, store, db);

ws.start();

for (const signal of ["SIGINT", "SIGTERM", "SIGQUIT"]) {
    process.on(signal, () => {
        console.log(
            `\nReceived ${signal}, closing websocket, redis and sqlite connections...`,
        );
        ws.shutdown();
        process.exit(0);
    });
}
