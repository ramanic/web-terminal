// App.tsx
import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import WebTerminal from "./components/WebTerminal";

const App = () => {
  const [passkey, setPasskey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onError = (error: string) => {
    setError(error);
    setPasskey(null);
  };

  const onSumbmit = (password: string | null) => {
    setPasskey(password);
    setError(null);
  };

  return passkey === null ? (
    <LoginScreen onSubmit={onSumbmit} error={error} />
  ) : (
    <WebTerminal onError={onError} passkey={passkey} />
  );
};

export default App;
