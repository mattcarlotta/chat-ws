import type { ResponseError } from "./errors";
import type { RedisStore, Req, Server } from "./types";
import { Method } from "./types";

export type RouterResponse =
    | Promise<Response | undefined | void>
    | Response
    | undefined
    | void;

type Controller = (
    this: Router,
    req: Req,
    server: Server,
    store: RedisStore,
) => RouterResponse;

type Route = Map<string, Controller>;

export interface RouterI {
    controllerHandler(
        controller: Controller,
        req: Request,
        server: Server,
        store: RedisStore,
    ): Promise<Response | undefined | void>;
    all(path: string, controller: Controller): Router;
    get(path: string, controller: Controller): Router;
    put(path: string, controller: Controller): Router;
    patch(path: string, controller: Controller): Router;
    post(path: string, controller: Controller): Router;
    delete(path: string, controller: Controller): Router;
    head(path: string, controller: Controller): Router;
    options(path: string, controller: Controller): Router;
    static(directory: string, controller: Controller): Router;
    serve(req: Request, server: Server, store: RedisStore): RouterResponse;
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

export default class Router implements RouterI {
    private controllers: Map<string, Route>;
    private statics: Map<string, Controller>;
    private staticKeys: string[];

    constructor() {
        this.controllers = new Map();
        this.statics = new Map();
        this.staticKeys = [];
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
        this.staticKeys.push(asset);

        if (process.env.DEBUG) {
            console.debug(
                `Registered a "GET" controller to serve a static "${asset}" file or directory`,
            );
        }

        return this;
    }

    public controllerHandler = async (
        controller: Controller,
        req: Req,
        server: Server,
        store: RedisStore,
    ): Promise<Response | undefined | void> => {
        try {
            const response = await controller.call(this, req, server, store);
            return response;
        } catch (error) {
            const err = error as ResponseError;
            return new Response(err?.error || err?.message, {
                status: err?.statusCode,
            });
        }
    };

    public serve(req: Req, server: Server, store: RedisStore): RouterResponse {
        req.URL = new URL(req.url);

        if (this.staticKeys.length) {
            const key =
                this.staticKeys.find((key) => req.URL.pathname.includes(key)) || "";
            const controller = this.statics.get(key);

            if (controller) {
                return req.method === Method.GET
                    ? this.controllerHandler(controller, req, server, store)
                    : this.sendError(404, "Not found.");
            }
        }

        const registeredPath = this.controllers.get(req.URL.pathname);
        if (!registeredPath) {
            return this.sendError(404, "Not found.");
        }

        const registeredCallback = registeredPath.get(req.method);
        if (!registeredCallback) {
            return this.sendError(404, "Not found.");
        }

        return this.controllerHandler(registeredCallback, req, server, store);
    }
}
