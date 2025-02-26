import type { ReactNode } from "react";
import ChatIcon from "./ChatIcon";

export default function Chat({ children, title }: { children: ReactNode; title?: ReactNode }) {
    return (
        <>
            <a
                id="skip-to-content"
                aria-label="Skip to main content"
                className="absolute left-[-9999px] top-4 z-50 rounded p-2 text-center text-white no-underline bg-blue-600 hover:bg-blue-700 hover:shadow-2xl dark:bg-purple-700 dark:hover:bg-purple-900 focus:left-5"
                href="#main"
            >
                Skip to content
            </a>
            <nav className="sticky top-0 z-10 flex bg-linear-to-r/decreasing from-indigo-500 to-teal-400 text-slate-100 border-b border-gray-400 p-4 shadow-sm dark:bg-gradient-to-r dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 dark:border-gray-700 sm:justify-center sm:items-center">
                <header className="flex flex-1 flex-row items-center space-x-2 md:justify-center" id="navbar">
                    <h1 className="text-3xl font-bold xs:text-4xl">Chat</h1>
                    <ChatIcon className="h-6 w-6" />
                </header>
            </nav>
            {title}
            <main id="main">{children}</main>
        </>
    );
}
