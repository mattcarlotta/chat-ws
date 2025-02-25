import type { ChangeEvent, FormEvent } from "react";
import Chat from "./Chat";

type LoginFormProps = {
    onSubmit: (e: FormEvent) => void;
    onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    username: string;
};

export default function LoginForm({ onInputChange, onSubmit, username }: LoginFormProps) {
    return (
        <Chat>
            <form
                className="h-[calc(100%-81px)] flex flex-col justify-center items-center space-y-4"
                onSubmit={onSubmit}
            >
                <div>
                    <label>
                        <input
                            id="username"
                            placeholder="Enter a username..."
                            className="text-black bg-white w-full py-3.5 pl-3.5 border border-gray-400 rounded"
                            type="text"
                            value={username}
                            onChange={onInputChange}
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
        </Chat>
    );
}
