import jwt from "jsonwebtoken";
import Router from "./router";
import { AuthValidationError, ServerError, ValidationError } from "./errors";

type ReqBodyPayload = { username: string; password: string; email: string };
type JWTUserId = { userId: string };

const router = new Router();

router
    .get("/", () => new Response(Bun.file(`./chat-client/dist/index.html`)))
    .post("/login", async function({ req, store, db }) {
        const { email, password } = (await req.json()) as ReqBodyPayload;

        if (!email || !password) {
            throw new AuthValidationError(
                "You must be signed in with a username before you can chat!",
            );
        }

        const user = await db.findUser(email, password);
        if (!user) {
            throw new AuthValidationError(
                "The email and/or password provided is not valid. Please try again.",
            );
        }

        await store.set(user.id, user.username, {
            EX: 2592000,
        });

        const token = jwt.sign(
            { userId: user.id },
            String(import.meta.env.JWT_SECRET),
        );

        return new Response(null, {
            headers: this.createHeaders({ token, ct: "application/json" }),
            status: 200,
        });
    })
    .post("/register", async function({ req, db }) {
        const { username, password, email } = (await req.json()) as ReqBodyPayload;

        if (!username || !password || !email) {
            throw new ValidationError(
                "You must provide an email, username and password to register!",
            );
        }

        const userAlreadyExists = db.findUserByEmail(email);
        if (userAlreadyExists) {
            return new Response(null, {
                status: 201,
            });
        }

        await db.createUser(username, password, email);

        return new Response(null, {
            status: 201,
        });
    })
    // .post("/logout", (req) => { })
    .get("/chat", async function({ req, server, store }) {
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
        ({ req }) =>
            new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`)),
    )
    .static(
        "chat.svg",
        ({ req }) =>
            new Response(Bun.file(`./chat-client/dist${req.URL.pathname}`)),
    );

export default router;
