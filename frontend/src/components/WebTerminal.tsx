// WebTerminal.tsx
import { useEffect, useRef, useState } from "react";
import { Terminal as LucideTerminal } from "lucide-react";
import { Terminal as XTerminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
interface Message {
  type: string;
  data: string;
}

type Props = {
  passkey: string;
  onError: (error: string) => void;
};
const WebTerminal = (props: Props) => {
  const { passkey, onError } = props;
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const xtermContainerRef = useRef<HTMLDivElement>(null);

  const waitAndCheck = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (wsRef.current?.readyState !== 1)
      return onError(
        "Error connecting to terminal server, Please check your password and internet connection. "
      );
  };

  useEffect(() => {
    // Initialize xterm
    const term = new XTerminal({
      theme: {
        background: "#000000",
        foreground: "#00ff00",
      },
      fontFamily: "monospace",
      fontSize: 14,
      cursorBlink: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    xtermRef.current = term;

    if (xtermContainerRef.current) {
      term.open(xtermContainerRef.current);
    }

    // Handle user input
    term.onData((data) => {
      sendMessage("input", data);
    });

    connectWebSocket();
    fitAddon.fit();

    return () => {
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`ws://localhost:8080/ws?passkey=${passkey}`);

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        xtermRef.current?.writeln("\r\n[✔] Connected to terminal server");
      };

      ws.onmessage = (event) => {
        const message: Message = JSON.parse(event.data);
        handleMessage(message);
      };

      ws.onclose = () => {
        setIsConnecting(false);
        setIsConnected(false);
        // xtermRef.current?.writeln("\r\n[✖] Connection closed");
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ws.onerror = (error: any) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        setIsConnected(false);
        waitAndCheck();
        // xtermRef.current?.writeln("\r\n[!] Connection error");
      };

      wsRef.current = ws;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to connect:", error);
      setIsConnecting(false);
      setIsConnected(false);
      onError(
        error?.message ||
          "Error connecting to terminal server, Please check your password and internet connection. "
      );
    }
  };

  const handleMessage = (message: Message) => {
    switch (message.type) {
      case "output":
        xtermRef.current?.write(message.data);
        break;
      case "pong":
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  const sendMessage = (type: string, data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: Message = { type, data };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-green-400 font-mono text-sm flex flex-col">
      {/* Terminal Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <LucideTerminal className="w-4 h-4" />
          <span className="text-gray-300">Web Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-gray-400">
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected"
              : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Xterm Terminal */}
      <div
        className="flex-1 bg-black overflow-hidden h-full"
        ref={xtermContainerRef}
      />

      {/* Connection Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-400 border-t-transparent"></div>
            <span className="text-cyan-400">
              Connecting to terminal server...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebTerminal;
