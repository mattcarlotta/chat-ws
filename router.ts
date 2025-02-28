import type { RedisStore, Req, Server } from "./types";
import { Method } from "./types";

type Controller = (
    this: Router,
    req: Req,
    server: Server,
    store: RedisStore,
) => Promise<Response | undefined> | Response | undefined;

type Route = Map<string, Controller>;

export type RouterI = typeof Router;

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
        store: RedisStore,
    ): Promise<Response | undefined> | Response | undefined;
    sendError(status: number, err: string): Response;
    createHeaders({
        token,
        clearToken,
        ct,
    }: {
        token?: string;
        clearToken?: boolean;
        ct?: string;
    }): Headers;
}

export default class Router implements RouterInterface {
    private controllers: Map<string, Route>;
    private statics: Map<string, Controller>;

    constructor() {
        this.controllers = new Map();
        this.statics = new Map();
    }

    private register(
        method: Method,
        path: string,
        controller: Controller,
    ): Router {
        const registeredPath = this.controllers.get(path);
        if (registeredPath) {
            const registeredCallback = registeredPath.get(method);
            if (registeredCallback) {
                throw new Error(
                    `Unable to register a ${method} at ${path} controller because one already exists.`,
                );
            }

            registeredPath.set(method, controller);
            this.controllers.set(path, registeredPath);
        } else {
            const newMethod = new Map();
            newMethod.set(method, controller);
            this.controllers.set(path, newMethod);
        }

        if (process.env.DEBUG) {
            console.debug(
                `Registered a "${method}" controller to point to "${path}"`,
            );
        }

        return this;
    }

    public all(path: string, controller: Controller): Router {
        return this.register(Method.ALL, path, controller);
    }

    public get(path: string, controller: Controller): Router {
        return this.register(Method.GET, path, controller);
    }

    public put(path: string, controller: Controller): Router {
        return this.register(Method.PUT, path, controller);
    }

    public patch(path: string, controller: Controller): Router {
        return this.register(Method.PATCH, path, controller);
    }

    public post(path: string, controller: Controller): Router {
        return this.register(Method.POST, path, controller);
    }

    public delete(path: string, controller: Controller): Router {
        return this.register(Method.DELETE, path, controller);
    }

    public head(path: string, controller: Controller): Router {
        return this.register(Method.HEAD, path, controller);
    }

    public options(path: string, controller: Controller): Router {
        return this.register(Method.OPTIONS, path, controller);
    }

    public static(asset: string, controller: Controller): Router {
        if (this.statics.has(asset)) {
            throw new Error(`The ${asset} can only be registed once.`);
        }

        this.statics.set(asset, controller);

        if (process.env.DEBUG) {
            console.debug(
                `Registered a "GET" controller to serve a static "${asset}" file or directory`,
            );
        }

        return this;
    }

    public serve(
        req: Req,
        server: Server,
        store: RedisStore,
    ): Promise<Response | undefined> | Response | undefined {
        req.URL = new URL(req.url);

        const registeredDirectoryKeys = Array.from(this.statics.keys());
        if (registeredDirectoryKeys.length) {
            const key = registeredDirectoryKeys.find((key) =>
                req.URL.pathname.includes(key),
            );

            if (key) {
                const controller = this.statics.get(key);
                if (controller) {
                    if (req.method !== Method.GET) {
                        console.error(`Unable "${req.method}" to static directories!`);
                        return new Response("Bad Req", { status: 400 });
                    }
                    return controller.call(this, req, server, store);
                }
            }
        }

        const registeredPath = this.controllers.get(req.URL.pathname);
        if (!registeredPath) {
            return new Response("Route not found", { status: 404 });
        }

        const registeredCallback = registeredPath.get(req.method);
        if (!registeredCallback) {
            return new Response("Route not found", { status: 404 });
        }

        return registeredCallback.call(this, req, server, store);
    }

    public sendError(status: number, err: string): Response {
        console.error(err);
        return new Response(err, {
            status,
            headers: this.createHeaders({ clearToken: true }),
        });
    }

    public createHeaders({
        token,
        clearToken,
        ct,
    }: { token?: string; clearToken?: boolean; ct?: string } = {}): Headers {
        const headers = new Headers();

        if (token) {
            headers.set("Set-Cookie", `token=${token}; path=/; Max-Age=2592000`);
        }

        if (clearToken) {
            headers.set("Set-Cookie", `token=; path=/; Max-Age=0`);
        }

        if (ct) {
            headers.set("Content-Type", ct);
        }

        // headers.set("Access-Control-Allow-Origin", "*");
        // headers.set(
        //     "Access-Control-Allow-Methods",
        //     "GET, POST, PUT, DELETE, OPTIONS",
        // );
        // headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        // headers.set("Access-Control-Max-Age", "86400");

        return headers;
    }
}
