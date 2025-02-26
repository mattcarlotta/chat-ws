import type { ChangeEvent, FormEvent } from "react";
import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

export default function LoginForm() {
    const { username, setConnectionStatus, setUsername } = useWebSocketContext();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!username.length) return;

        setConnectionStatus(ConnectionStatus.CONNECTING);
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
                            onChange={handleInputChange}
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
            </form>
        </Nav>
    );
}
