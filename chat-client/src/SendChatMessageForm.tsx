import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import SendIcon from "./SendIcon";
import useWebSocketContext from "./useWebSocketContext";

export default function SendChatMessageForm() {
    const { socket } = useWebSocketContext();
    const chatInputRef = useRef<HTMLInputElement | null>(null);
    const [message, setMessage] = useState("");

    const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    const handleChatSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!message) return;

        setMessage("");
        socket?.send(message);
    };

    useEffect(() => {
        chatInputRef.current?.focus();
    }, []);

    return (
        <div className="sticky bottom-0">
            <div className="relative mx-auto flex h-full w-full max-w-3xl flex-1 flex-col md:px-2">
                <div className="relative z-10 flex w-full flex-col rounded-t-2xl border border-b-0 border-orange-300 bg-orange-800/10 pt-4 pr-2.5 pb-2.5 pl-4 shadow-md sm:mx-0 dark:border-purple-800 dark:bg-purple-950">
                    <form onSubmit={handleChatSubmit}>
                        <label className="fixed left-[-99999px]" htmlFor="send-message">
                            Send a message...
                        </label>
                        <div className="flex space-x-2 rounded bg-white">
                            <div className="flex-1">
                                <input
                                    ref={chatInputRef}
                                    id="send-message"
                                    placeholder="Send a chat message..."
                                    className="w-full rounded p-2.5 text-black"
                                    autoComplete="off"
                                    type="text"
                                    value={message}
                                    onChange={handleMessageChange}
                                />
                            </div>
                            <button
                                type="submit"
                                className="cursor-pointer items-center justify-center rounded p-1.5 text-lg font-semibold text-white hover:bg-black/10"
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
