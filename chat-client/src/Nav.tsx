import type { ReactNode } from "react";
import ChatIcon from "./ChatIcon";

export default function Chat({ children, title }: { children: ReactNode; title?: ReactNode }) {
    return (
        <>
            <a
                id="skip-to-content"
                aria-label="Skip to main content"
                className="absolute top-4 left-[-9999px] z-50 rounded bg-blue-600 p-2 text-center text-white no-underline hover:bg-blue-700 hover:shadow-2xl focus:left-5 dark:bg-purple-700 dark:hover:bg-purple-900"
                href="#main"
            >
                Skip to content
            </a>
            <nav className="sticky top-0 z-10 flex border-b border-gray-400 bg-linear-to-r/decreasing from-indigo-500 to-teal-400 p-4 text-slate-100 shadow-sm sm:items-center sm:justify-center dark:border-gray-700 dark:bg-gradient-to-r dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
                <header className="flex flex-1 flex-row items-center space-x-2 md:justify-center" id="navbar">
                    <h1 className="xs:text-4xl text-3xl font-bold">Chat</h1>
                    <ChatIcon className="h-6 w-6" />
                </header>
            </nav>
            {title}
            <main id="main">{children}</main>
        </>
    );
}
