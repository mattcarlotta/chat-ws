export function createHeaders({
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

export function sendError(status: number, err: string): Response {
    console.error(err);
    return new Response(err, {
        status,
        headers: createHeaders({ clearToken: true }),
    });
}
