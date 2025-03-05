import Nav from "./Nav";
import useWebSocketContext from "./useWebSocketContext";

export default function ConnectionError() {
    const { error } = useWebSocketContext();
    return (
        <Nav>
            <div className="flex h-[calc(100%-81px)] flex-col items-center justify-center">
                <div className="rounded border border-orange-300 bg-orange-800/10 p-4 text-center text-gray-600 dark:border-purple-900 dark:bg-purple-900/50">
                    <header id="app-error">
                        <h2 className="text-3xl font-bold text-red-600">An Error Occurred: Unable to load the app.</h2>
                    </header>
                    <p className="text-xl text-red-600">{error}</p>
                </div>
            </div>
        </Nav>
    );
}
