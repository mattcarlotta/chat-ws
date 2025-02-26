import { MessageType } from "./types";
import clsx from "clsx";
import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";

export default function NavBox() {
    const { socket, messages, onlineUsers } = useWebSocketContext();

    const handleDisconnect = () => {
        socket?.close();
    };

    return (
        <Nav
            title={
                <div className="fixed flex items-center top-4 right-4 space-x-4 z-20">
                    <p className="hidden md:block">
                        Online: {onlineUsers} user{onlineUsers > 1 ? "s" : ""}
                    </p>
                    <button
                        className="text-white cursor-pointer p-2 bg-red-500 rounded shadow-md"
                        type="button"
                        onClick={handleDisconnect}
                    >
                        Disconnect
                    </button>
                </div>
            }
        >
            <div className="h-[calc(100%-170px)] mx-auto w-full max-w-4xl space-y-3 overflow-y-auto bg-orange-800/10 border border-orange-300 shadow-md p-4 rounded dark:bg-purple-900/10 dark:border-purple-900 mt-4">
                {messages.map((m, index) => (
                    <div
                        title={new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long" }).format(
                            new Date(m.timestamp)
                        )}
                        className="grid grid-cols-2 gap-y-0.5 md:gap-y-0 md:gap-x-4 md:grid-cols-4"
                        key={m.id}
                    >
                        {
                            {
                                [MessageType.WELCOME]: (
                                    <p className="col-span-2 text-gray-500 rounded md:col-span-4">
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
                                        {m.sentByCurrentUser && <div className="col-span-2 md:col-span-1" />}
                                        <div className={clsx("col-span-3", m.sentByCurrentUser && "flex justify-end")}>
                                            {!m.sentByCurrentUser && <p className="italic">{m.username} says...</p>}
                                            <p
                                                className={clsx(
                                                    "text-white p-1.5 rounded-xl max-w-fit",
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
