import { createClient } from "@redis/client";
import WebSocketServer from "./websocket";
import routes from "./routes";

const store = createClient({ url: import.meta.env.REDIS_URL });

new WebSocketServer(import.meta.env.PORT, routes, store).start();
