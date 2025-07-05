import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import "xterm/css/xterm.css";

interface Message {
  type: string;
  data: string;
}

interface Props {
  passkey: string | null;
}

const WebTerminal: React.FC<Props> = ({ passkey }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const xtermContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = new XTerminal({
      theme: {
        background: "#000000",
        foreground: "#f2f2f2",
        cursor: "#f2f2f2",
      },
      fontFamily: "monospace",
      fontSize: 14,
      cursorBlink: true,
      disableStdin: false,
    });

    xtermRef.current = term;

    if (xtermContainerRef.current) {
      term.open(xtermContainerRef.current);
    }

    term.onData((data) => {
      sendMessage("input", data);
    });

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, []);

  const connectWebSocket = () => {
    const url = `ws://localhost:8080/ws${
      passkey ? `?key=${encodeURIComponent(passkey)}` : ""
    }`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnecting(false);
      setIsConnected(true);
      xtermRef.current?.writeln("\r\n[connected]");
    };

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      if (message.type === "output") {
        xtermRef.current?.write(message.data);
      }
    };

    ws.onclose = () => {
      setIsConnecting(false);
      setIsConnected(false);
      xtermRef.current?.writeln("\r\n[connection closed]");
    };

    ws.onerror = () => {
      setIsConnecting(false);
      setIsConnected(false);
      xtermRef.current?.writeln("\r\n[error connecting]");
    };

    wsRef.current = ws;
  };

  const sendMessage = (type: string, data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  };
  if (!isConnected) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        No connection found
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white relative">
      <div
        ref={xtermContainerRef}
        className="h-full w-full"
        style={{ fontSize: "14px", lineHeight: "1.4" }}
      />
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center text-white text-sm">
          Connecting...
        </div>
      )}
    </div>
  );
};

export default WebTerminal;
