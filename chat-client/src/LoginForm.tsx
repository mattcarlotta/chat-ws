import type { FormEvent } from "react";
import { useState } from "react";
// import Cookie from "js-cookie";
import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

export default function LoginForm() {
    const { setConnectionStatus } = useWebSocketContext();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setError("");
        if (!username.length || !password.length) {
            setError("You must provide a username and a password!");
            return;
        }

        try {
            const res = await fetch(`http://${import.meta.env.VITE_HOST_URL}/`, {
                method: "POST",
                body: JSON.stringify({ username, password }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await res.text();
            if (!res.ok || !data) {
                throw Error(data || "Unable to get token!");
            }

            // Cookie.set("token", data, { path: "/", expires: 2592000 });

            setConnectionStatus(ConnectionStatus.CONNECTING);
        } catch (error) {
            setError((error as Error)?.message);
        }
    };

    return (
        <Nav>
            <form
                className="h-[calc(100%-81px)] flex flex-col justify-center items-center space-y-4"
                onSubmit={handleSubmit}
            >
                <div>
                    <label>
                        <input
                            id="username"
                            placeholder="Enter a username..."
                            className="text-black bg-white w-full py-3.5 pl-3.5 border border-gray-400 rounded"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            id="password"
                            placeholder="Enter a password..."
                            className="text-black bg-white w-full py-3.5 pl-3.5 border border-gray-400 rounded"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <button
                        type="submit"
                        className="cursor-pointer rounded bg-blue-600 py-2.5 px-24 text-white text-lg font-semibold hover:bg-blue-700 dark:bg-purple-800 dark:hover:bg-purple-900"
                    >
                        Log In
                    </button>
                </div>
                {Boolean(error) && <p className="text-red-500 font-bold">{error}</p>}
            </form>
        </Nav>
    );
}
