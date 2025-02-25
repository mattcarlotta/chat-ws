import Chat from "./Chat";

export default function ConnectionError({ error }: { error: string }) {
    return (
        <Chat>
            <div className="h-[calc(100%-81px)] flex flex-col items-center justify-center">
                <div className="p-4 text-gray-600 bg-orange-800/10 border border-orange-300 text-center rounded dark:bg-purple-900/50 dark:border-purple-900">
                    <header id="app-error">
                        <h2 className="text-3xl font-bold text-red-600">An Error Occurred: Unable to load the app.</h2>
                    </header>
                    <p className="text-xl text-red-600">{error}</p>
                </div>
            </div>
        </Chat>
    );
}
