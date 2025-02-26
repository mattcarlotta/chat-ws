import type { WebSocketContextT } from "./types";
import { createContext, useContext } from "react";

export const WebSocketContext = createContext<WebSocketContextT | null>(null);

export default function useWebSocketContext() {
    const context = useContext(WebSocketContext);

    if (!context) {
        throw new Error("This component cannot be rendered outside the WebSocketProvider component");
    }

    return context;
}
