import type { Message } from "./types";
import { MessageType } from "./types";
import clsx from "clsx";
import Chat from "./Chat";

type ChatBoxProps = {
    onlineUsers: number;
    messages: Message[];
    onDisconnect: () => void;
};

export default function ChatBox({ onDisconnect, onlineUsers, messages }: ChatBoxProps) {
    return (
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
                                Welcome to the chatroom {m.username}! Use the textbox below to send a message.
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
    );
}
