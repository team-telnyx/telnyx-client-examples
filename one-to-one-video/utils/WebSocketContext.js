import React, { useMemo, useState } from 'react';

const WebSocketContext = React.createContext();

export function WebSocketContextProvider({ children }) {
  const [isReady, setIsReady] = useState();
  const [message, setMessage] = useState();

  const ws = useMemo(() => {
    if (typeof window !== 'undefined') {
      const ws = new window.WebSocket(
        `ws://${process.env.NEXT_PUBLIC_WS_SERVER_HOST}/${process.env.NEXT_PUBLIC_WS_SERVER_PATH}`
      );

      ws.addEventListener('open', () => {
        console.log('WebSocketContextProvider open');

        setIsReady(true);
      });

      ws.addEventListener('message', ({ data }) => {
        console.log('WebSocketContextProvider message:', data);

        setMessage(JSON.parse(data));
      });

      return ws;
    }

    return null;
  }, []);

  const value = ws
    ? {
        isReady,
        message,
        sendMessage: ws.send.bind(ws),
      }
    : {};

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketContext;
