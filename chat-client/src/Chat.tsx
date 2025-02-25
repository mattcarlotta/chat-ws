import type { ReactNode } from "react";
import Nav from "./Nav";

export default function Chat({ children, title }: { children: ReactNode; title?: ReactNode }) {
    return (
        <>
            <Nav />
            {title}
            <main id="main">{children}</main>
        </>
    );
}
