import jwt from "jsonwebtoken";
import Router from "./router";
import { ServerError, ValidationError } from "./errors";

type JWTPayload = { username: string; password: string };
type JWTUserId = { userId: string };

const router = new Router();

router
    .get("/", () => new Response(Bun.file(`./chat-client/dist/index.html`)))
    .post("/", async function(req, _server, store) {
        const { username, password } = (await req.json()) as JWTPayload;

        if (!username || password !== import.meta.env.PASSWORD) {
            throw new ValidationError(
                "You must be signed in with a username before you can chat!",
            );
        }

        const userId = crypto.randomUUID();
        await store.set(userId, username, {
            EX: 2592000,
        });

        const token = jwt.sign({ userId }, String(import.meta.env.JWT_SECRET));

        return new Response(token, {
            headers: this.createHeaders({ token, ct: "application/json" }),
            status: 200,
        });
    })
    .get("/chat", async function(req, server, store) {
        const token = req.URL.searchParams.get("token") || "";
        if (!token) {
            throw new ValidationError(
                "User attempted to connect with an empty token.",
            );
        }

        const { userId } = jwt.verify(token, String(import.meta.env.JWT_SECRET), {
            maxAge: 2592000,
        }) as JWTUserId;

        const username = await store.get(userId || "");
        if (!username) {
            throw new ValidationError(
                "User attempted to connect with an invalid token.",
            );
        }

        const upgraded = server.upgrade(req, {
            data: { userId, username },
        });

        if (upgraded) return;

        throw new ServerError("Upgrade failed - Websocket server only");
    })
    .static(
        "assets",
        (req) => new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`)),
    )
    .static(
        "chat.svg",
        (req) => new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`)),
    );

export default router;
