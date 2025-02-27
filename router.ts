import type { Server } from "bun";
import type {
    RedisClientType,
    RedisFunctions,
    RedisModules,
    RedisScripts,
} from "@redis/client";
import jwt from "jsonwebtoken";
import { createHeaders, sendError } from "./utils";

export enum Method {
    ALL = "ALL",
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    OPTIONS = "OPTIONS",
    HEAD = "HEAD",
}

export type Controller = (
    req: Request,
    server: Server,
    store: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
) => Promise<Response | undefined> | Response | undefined;
export type Route = Map<string, Controller>;

export interface RouterInterface {
    all(path: string, controller: Controller): Router;
    get(path: string, controller: Controller): Router;
    put(path: string, controller: Controller): Router;
    patch(path: string, controller: Controller): Router;
    post(path: string, controller: Controller): Router;
    delete(path: string, controller: Controller): Router;
    head(path: string, controller: Controller): Router;
    options(path: string, controller: Controller): Router;
    static(directory: string, controller: Controller): Router;
    serve(
        req: Request,
        server: Server,
        store: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
    ): Promise<Response | undefined> | Response | undefined;
}

class Router implements RouterInterface {
    private controllers: Map<string, Route>;
    private statics: Map<string, Controller>;

    constructor() {
        this.controllers = new Map();
        this.statics = new Map();
    }

    private register(method: Method, path: string, controller: Controller) {
        const registeredPath = this.controllers.get(path);
        if (registeredPath) {
            const registeredCallback = registeredPath.get(method);
            if (registeredCallback) {
                throw new Error(
                    `Unable to register a ${method} at ${path} because one already exists.`,
                );
            }

            registeredPath.set(method, controller);
            this.controllers.set(path, registeredPath);
        } else {
            const newMethod = new Map();
            newMethod.set(method, controller);
            this.controllers.set(path, newMethod);
        }

        return this;
    }

    public all(path: string, controller: Controller) {
        return this.register(Method.ALL, path, controller);
    }

    public get(path: string, controller: Controller) {
        return this.register(Method.GET, path, controller);
    }

    public put(path: string, controller: Controller) {
        return this.register(Method.PUT, path, controller);
    }

    public patch(path: string, controller: Controller) {
        return this.register(Method.PATCH, path, controller);
    }

    public post(path: string, controller: Controller) {
        return this.register(Method.POST, path, controller);
    }

    public delete(path: string, controller: Controller) {
        return this.register(Method.DELETE, path, controller);
    }

    public head(path: string, controller: Controller) {
        return this.register(Method.HEAD, path, controller);
    }

    public options(path: string, controller: Controller) {
        return this.register(Method.OPTIONS, path, controller);
    }

    public static(directory: string, controller: Controller) {
        if (this.statics.has(directory)) {
            throw new Error(`The ${directory} can only be registed once.`);
        }

        this.statics.set(directory, controller);

        return this;
    }

    public serve(
        req: Request,
        server: Server,
        store: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
    ) {
        const url = new URL(req.url);

        const registeredDirectoryKeys = Array.from(this.statics.keys());
        if (registeredDirectoryKeys.length) {
            const key = registeredDirectoryKeys.find((key) =>
                url.pathname.includes(key),
            );

            if (key) {
                const controller = this.statics.get(key);
                if (controller) {
                    return controller(req, server, store);
                }
            }
        }

        const registeredPath = this.controllers.get(url.pathname);
        if (!registeredPath) {
            return new Response("Route not found", { status: 404 });
        }

        const registeredCallback = registeredPath.get(req.method);
        if (!registeredCallback) {
            return new Response("Route not found", { status: 404 });
        }

        return registeredCallback(req, server, store);
    }
}

const router = new Router();

router
    .get("/", () => {
        return new Response(Bun.file(`./chat-client/dist/index.html`));
    })
    .post("/", async (req, _, store) => {
        try {
            const { username, password } = (await req.json()) as {
                username: string;
                password: string;
            };
            if (!username || password !== import.meta.env.PASSWORD) {
                return sendError(
                    403,
                    "You must sign in with a username before you can chat!",
                );
            }
            const userId = crypto.randomUUID();
            await store.set(userId, username, {
                EX: 2592000,
            });

            const token = jwt.sign({ userId }, import.meta.env.JWT_SECRET);

            return new Response(token, {
                headers: createHeaders({ token, ct: "application/json" }),
                status: 200,
            });
        } catch (error) {
            return sendError(400, (error as Error)?.message);
        }
    })
    .get("/chat", async (req, server, store) => {
        const url = new URL(req.url);
        try {
            const token = url.searchParams.get("token") || "";
            if (!token) {
                throw Error("User attempted to connect with an empty token.");
            }
            const { userId } = jwt.verify(token, import.meta.env.JWT_SECRET, {
                maxAge: 2592000,
            }) as {
                userId: string;
            };

            const username = await store.get(userId || "");
            if (!username) {
                throw Error("User attempted to connect with an invalid token.");
            }

            const upgraded = server.upgrade(req, {
                data: { userId, username },
            });

            if (upgraded) return;

            return sendError(500, "Upgrade failed - Websocket server only");
        } catch (error) {
            console.log(error);
            return sendError(403, "Invalid token!");
        }
    })
    .static("assets", (req) => {
        const url = new URL(req.url);

        return new Response(Bun.file(`./chat-client/dist${url.pathname}`));
    })
    .static("chat.svg", (req) => {
        const url = new URL(req.url);

        return new Response(Bun.file(`./chat-client/dist${url.pathname}`));
    });

export default router;
