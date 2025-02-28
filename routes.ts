import jwt from "jsonwebtoken";
import Router from "./router";

type JWTPayload = { username: string; password: string };
type JWTUserId = { userId: string };

const router = new Router();

router
    .get("/", () => new Response(Bun.file(`./chat-client/dist/index.html`)))
    .post("/", async function(req, _, store) {
        try {
            const { username, password } = (await req.json()) as JWTPayload;

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

            const token = jwt.sign({ userId }, String(import.meta.env.JWT_SECRET));

            return new Response(token, {
                headers: this.createHeaders({ token, ct: "application/json" }),
                status: 200,
            });
        } catch (error) {
            return this.sendError(400, (error as Error)?.message);
        }
    })
    .get("/chat", async function(req, server, store) {
        try {
            const token = req.URL.searchParams.get("token") || "";
            if (!token) {
                throw Error("User attempted to connect with an empty token.");
            }
            const { userId } = jwt.verify(token, String(import.meta.env.JWT_SECRET), {
                maxAge: 2592000,
            }) as JWTUserId;

            const username = await store.get(userId || "");
            if (!username) {
                throw Error("User attempted to connect with an invalid token.");
            }

            const upgraded = server.upgrade(req, {
                data: { userId, username },
            });

            if (upgraded) return;

            return this.sendError(500, "Upgrade failed - Websocket server only");
        } catch (error) {
            console.log(error);
            return this.sendError(403, "Invalid token!");
        }
    })
    .static("assets", (req) => {
        return new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`));
    })
    .static("chat.svg", (req) => {
        return new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`));
    });

export default router;
