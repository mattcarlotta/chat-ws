import Nav from "./Nav";
import ConnectionError from "./ConnectionError";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import ChatBox from "./ChatBox";
import SendChatMessageForm from "./SendChatMessageForm";
import useWebSocketContext from "./useWebSocketContext";
import { ConnectionStatus } from "./types";

function App() {
    const { connectionStatus } = useWebSocketContext();

    return (
        <>
            {
                {
                    [ConnectionStatus.CONNECTING]: (
                        <Nav>
                            <div className="h-[calc(100%-81px)] flex justify-center items-center">
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
