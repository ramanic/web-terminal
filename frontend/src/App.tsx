// App.tsx
import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import WebTerminal from "./components/WebTerminal";

const App = () => {
  const [passkey, setPasskey] = useState<string | null>(null);
  console.log(passkey);
  return passkey === null ? (
    <LoginScreen onSubmit={setPasskey} />
  ) : (
    <WebTerminal passkey={passkey} />
  );
};

export default App;
