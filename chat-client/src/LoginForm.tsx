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
                className="h-[calc(100%-81px)] flex flex-col justify-center items-center space-y-4"
                onSubmit={handleSubmit}
            >
                <div>
                    <label>
                        <input
                            id="email"
                            placeholder="Enter email..."
                            className="text-black bg-white w-full py-3.5 pl-3.5 border border-gray-400 rounded"
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
                <p>
                    Don&apos;t have an accont?&nbsp;
                    <button
                        className="text-blue-700 cursor-pointer hover:underline"
                        onClick={handleRegister}
                        type="button"
                    >
                        Register here
                    </button>
                </p>
                {Boolean(error) && <p className="text-red-500 font-bold">{error}</p>}
            </form>
        </Nav>
    );
}
