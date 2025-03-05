import type { FormEvent } from "react";
import { useState } from "react";
import Nav from "./Nav";
import { ConnectionStatus } from "./types";
import useWebSocketContext from "./useWebSocketContext";

export default function RegisterForm() {
    const { setConnectionStatus } = useWebSocketContext();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setError("");
        if (!username.length || !password.length || !email.length) {
            setError("You must provide a username, password and email!");
            return;
        }

        try {
            const res = await fetch(`http://${import.meta.env.VITE_HOST_URL}/register`, {
                method: "POST",
                body: JSON.stringify({ username, password, email }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                const data = await res.text();
                throw Error(data || "Unable to create user!");
            }

            setConnectionStatus(ConnectionStatus.UNAUTHED);
        } catch (error) {
            setError((error as Error)?.message);
        }
    };

    return (
        <Nav>
            <form
                className="flex h-[calc(100%-81px)] flex-col items-center justify-center space-y-4"
                onSubmit={handleSubmit}
            >
                <div>
                    <label>
                        <input
                            id="email"
                            placeholder="Enter email..."
                            className="w-full rounded border border-gray-400 bg-white py-3.5 pl-3.5 text-black"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            id="username"
                            placeholder="Enter a username..."
                            className="w-full rounded border border-gray-400 bg-white py-3.5 pl-3.5 text-black"
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
                            className="w-full rounded border border-gray-400 bg-white py-3.5 pl-3.5 text-black"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <button
                        type="submit"
                        className="cursor-pointer rounded bg-blue-600 px-24 py-2.5 text-lg font-semibold text-white hover:bg-blue-700 dark:bg-purple-800 dark:hover:bg-purple-900"
                    >
                        Log In
                    </button>
                </div>
                {Boolean(error) && <p className="font-bold text-red-500">{error}</p>}
            </form>
        </Nav>
    );
}
