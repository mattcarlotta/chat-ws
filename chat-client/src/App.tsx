import ChatBox from "./ChatBox";
import ConnectionError from "./ConnectionError";
import LoginForm from "./LoginForm";
import Nav from "./Nav";
import RegisterForm from "./RegisterForm";
import SendChatMessageForm from "./SendChatMessageForm";
import { ConnectionStatus } from "./types";
import useWebSocketContext from "./useWebSocketContext";

function App() {
    const { connectionStatus } = useWebSocketContext();

    return (
        <>
            {
                {
                    [ConnectionStatus.CONNECTING]: (
                        <Nav>
                            <div className="flex h-[calc(100%-81px)] items-center justify-center">
                                <p>Loading...</p>
                            </div>
                        </Nav>
                    ),
                    [ConnectionStatus.CONNECTED]: (
                        <>
                            <ChatBox />
                            <SendChatMessageForm />
                        </>
                    ),
                    [ConnectionStatus.ERROR]: <ConnectionError />,
                    [ConnectionStatus.UNAUTHED]: <LoginForm />,
                    [ConnectionStatus.REGISTERING]: <RegisterForm />
                }[connectionStatus]
            }
        </>
    );
}

export default App;
