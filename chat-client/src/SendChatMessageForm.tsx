import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import SendIcon from "./SendIcon";

type SendChatMessageFormProps = {
    onChatSubmit: (m: string) => void;
};

export default function SendChatMessageForm({ onChatSubmit }: SendChatMessageFormProps) {
    const [message, setMessage] = useState("");

    const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const handleChatSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!message) return;

        setMessage("");
        onChatSubmit(message);
    };

    return (
        <div className="sticky bottom-0">
            <div className="relative mx-auto flex h-full w-full max-w-3xl flex-1 flex-col md:px-2">
                <div className="flex flex-col pl-4 pt-4 pr-2.5 pb-2.5 relative z-10 rounded-t-2xl border-b-0 bg-orange-800/10 border border-orange-300 w-full shadow-md dark:bg-purple-950 dark:border-purple-800 sm:mx-0">
                    <form onSubmit={handleChatSubmit}>
                        <label className="fixed left-[-99999px]" htmlFor="send-message">
                            Send a message...
                        </label>
                        <div className="flex space-x-2 bg-white rounded">
                            <div className="flex-1">
                                <input
                                    id="send-message"
                                    placeholder="Send a message..."
                                    className="w-full text-black p-2.5 rounded"
                                    autoComplete="off"
                                    type="text"
                                    value={message}
                                    onChange={handleMessageChange}
                                />
                            </div>
                            <button
                                type="submit"
                                className="justify-center items-center cursor-pointer rounded p-1.5 text-white text-lg font-semibold hover:bg-black/10"
                            >
                                <SendIcon className="h-8 w-8 text-purple-800" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
