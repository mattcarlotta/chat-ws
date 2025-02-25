import type { ChangeEvent, FormEvent } from "react";
import type { Message } from "./types";
import { MessageType } from "./types";
import clsx from "clsx";
import Chat from "./Chat";
import SendIcon from "./SendIcon";

type ChatBoxProps = {
    onlineUsers: number;
    message: string;
    messages: Message[];
    onChatSubmit: (e: FormEvent) => void;
    onDisconnect: () => void;
    onMessageChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function ChatBox({
    onChatSubmit,
    onDisconnect,
    onMessageChange,
    onlineUsers,
    message,
    messages
}: ChatBoxProps) {
    return (
        <>
            <Chat
                title={
                    <div className="fixed flex items-center top-4 right-4 space-x-4 z-20">
                        <p className="hidden md:block">
                            Online: {onlineUsers} user{onlineUsers > 1 ? "s" : ""}
                        </p>
                        <button
                            className="text-white cursor-pointer p-2 bg-red-500 rounded shadow-md"
                            type="button"
                            onClick={onDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                }
            >
                <div className="h-[calc(100%-170px)] mx-auto w-full max-w-7xl space-y-3 overflow-y-auto bg-orange-800/10 border border-orange-300 shadow-md p-4 rounded dark:bg-purple-900/10 dark:border-purple-900 mt-4">
                    {messages.map((m, index) => (
                        <div
                            title={new Intl.DateTimeFormat("en-US", {
                                dateStyle: "full",
                                timeStyle: "long"
                            }).format(new Date(m.timestamp))}
                            className="grid grid-cols-2 gap-x-4"
                            key={m.id}
                        >
                            {m.type === MessageType.WELCOME && (
                                <p className="col-span-2 text-gray-500 rounded">
                                    Welcome to the chatroom {m.username}!
                                </p>
                            )}
                            {m.type === MessageType.USER_JOINED && (
                                <p className="col-span-2 rounded text-gray-500">{m.username} has joined the chat!</p>
                            )}
                            {m.type === MessageType.USER_LEFT && (
                                <p className="col-span-2 rounded text-gray-500">{m.username} left the chat.</p>
                            )}
                            {m.type === MessageType.USER_MESSAGE && (
                                <>
                                    {m.sentByCurrentUser && <div className="w-full" />}
                                    <div className="w-full">
                                        <p>{m.sentByCurrentUser ? "You" : m.username} wrote...</p>
                                        <p
                                            className={clsx(
                                                "text-white p-2 rounded",
                                                m.sentByCurrentUser ? "bg-blue-500" : "bg-gray-700"
                                            )}
                                        >
                                            {m.message}
                                        </p>
                                    </div>
                                    {!m.sentByCurrentUser && <div className="w-full" />}
                                </>
                            )}
                            {messages.length === index + 1 && (
                                <div
                                    className="col-span-2 mt-4"
                                    ref={(e) => e?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </Chat>
            <div className="sticky bottom-0">
                <div className="relative mx-auto flex h-full w-full max-w-3xl flex-1 flex-col md:px-2">
                    <div className="flex flex-col pl-4 pt-4 pr-2.5 pb-2.5 relative z-10 rounded-t-2xl border-b-0 bg-orange-800/10 border border-orange-300 w-full shadow-md dark:bg-purple-950 dark:border-purple-800 sm:mx-0">
                        <form onSubmit={onChatSubmit}>
                            <label className="fixed left-[-99999px]" htmlFor="send-message">
                                Send a message...
                            </label>
                            <div className="flex space-x-2">
                                <div className="flex-1">
                                    <input
                                        id="send-message"
                                        placeholder="Send a message..."
                                        className="w-full bg-white text-black p-2 rounded"
                                        autoComplete="off"
                                        type="text"
                                        value={message}
                                        onChange={onMessageChange}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="justify-center items-center cursor-pointer rounded bg-blue-600 p-1 text-white text-lg font-semibold hover:bg-blue-700 dark:bg-purple-800 dark:hover:bg-purple-900"
                                >
                                    <SendIcon className="h-8 w-8" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
