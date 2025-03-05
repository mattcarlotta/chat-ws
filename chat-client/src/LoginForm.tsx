import type { FormEvent } from "react";
import { useState } from "react";
// import Cookie from "js-cookie";
import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

export default function LoginForm() {
    const { setConnectionStatus } = useWebSocketContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleRegister = () => {
        setConnectionStatus(ConnectionStatus.REGISTERING);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setError("");
        if (!email.length || !password.length) {
            setError("You must provide an email and a password!");
            return;
        }

        try {
            const res = await fetch(`http://${import.meta.env.VITE_HOST_URL}/login`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!res.ok) {
                const data = await res.text();
                throw Error(data || "There was a problem logging in. Please try again.");
            }

            setConnectionStatus(ConnectionStatus.CONNECTING);
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
                <p>
                    Don&apos;t have an accont?&nbsp;
                    <button
                        className="cursor-pointer text-blue-700 hover:underline"
                        onClick={handleRegister}
                        type="button"
                    >
                        Register here
                    </button>
                </p>
                {Boolean(error) && <p className="font-bold text-red-500">{error}</p>}
            </form>
        </Nav>
    );
}
