import { MessageType } from "./types";
import clsx from "clsx";
import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";

export default function NavBox() {
    const { setError, messages, onlineUsers } = useWebSocketContext();

    const handleDisconnect = async () => {
        try {
            const res = await fetch(`http://${import.meta.env.VITE_HOST_URL}/logout`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const data = await res.text();
                throw Error(data || "There was a problem logging out.");
            }
        } catch (error) {
            setError((error as Error)?.message);
        }
    };

    return (
        <Nav
            title={
                <div className="fixed top-4 right-4 z-20 flex items-center space-x-4">
                    <p className="hidden md:block">
                        Online: {onlineUsers} user{onlineUsers > 1 ? "s" : ""}
                    </p>
                    <button
                        className="cursor-pointer rounded bg-red-500 p-2 text-white shadow-md"
                        type="button"
                        onClick={handleDisconnect}
                    >
                        Disconnect
                    </button>
                </div>
            }
        >
            <div className="mx-auto mt-4 h-[calc(100%-170px)] w-full max-w-4xl space-y-3 overflow-y-auto rounded border border-orange-300 bg-orange-800/10 p-4 shadow-md dark:border-purple-900 dark:bg-purple-900/10">
                {messages.map((m, index) => (
                    <div
                        title={new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long" }).format(
                            new Date(m.createdAt)
                        )}
                        className="grid grid-cols-2 gap-y-0.5 md:grid-cols-4 md:gap-x-4 md:gap-y-0"
                        key={m.id}
                    >
                        {
                            {
                                [MessageType.WELCOME]: (
                                    <p className="col-span-2 rounded text-gray-500 md:col-span-4">
                                        Welcome to the chatroom {m.username}! Use the textbox below to send a message.
                                    </p>
                                ),
                                [MessageType.ERROR]: <p>Error</p>,
                                [MessageType.USER_LEFT]: (
                                    <p className="col-span-2 rounded-xl text-gray-500 md:col-span-4">
                                        {m.username} left the chat.
                                    </p>
                                ),
                                [MessageType.USER_JOINED]: (
                                    <p className="col-span-2 rounded-xl text-gray-500 md:col-span-4">
                                        {m.username} has joined the chat!
                                    </p>
                                ),
                                [MessageType.USER_MESSAGE]: (
                                    <>
                                        {Boolean(m.sentByCurrentUser) && <div className="col-span-2 md:col-span-1" />}
                                        <div
                                            className={clsx(
                                                "col-span-3",
                                                Boolean(m.sentByCurrentUser) && "flex justify-end"
                                            )}
                                        >
                                            {!m.sentByCurrentUser && <p className="italic">{m.username} says...</p>}
                                            <p
                                                className={clsx(
                                                    "max-w-fit rounded-xl p-1.5 text-white",
                                                    m.sentByCurrentUser ? "bg-blue-500" : "bg-gray-700"
                                                )}
                                            >
                                                {m.message}
                                            </p>
                                        </div>
                                        {!m.sentByCurrentUser && <div className="col-span-2 md:col-span-1" />}
                                    </>
                                )
                            }[m.type]
                        }
                        {messages.length === index + 1 && (
                            <div
                                className="col-span-2 mt-4"
                                ref={(e) => e?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                            />
                        )}
                    </div>
                ))}
            </div>
        </Nav>
    );
}
