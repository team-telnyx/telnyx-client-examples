import React, { useMemo } from 'react';

const WebSocketContext = React.createContext();

export function WebSocketContextProvider({ children }) {
  const ws = useMemo(() => {
    if (typeof window !== 'undefined') {
      const ws = new window.WebSocket(
        process.env.NEXT_PUBLIC_WS_SERVER_URL ||
          `ws://localhost:${process.env.NEXT_PUBLIC_WS_SERVER_PORT}`
      );

      ws.addEventListener('open', () => {
        console.log('WebSocketContextProvider open');
      });

      ws.addEventListener('message', ({ data }) => {
        console.log('WebSocketContextProvider message:', data);
      });

      return ws;
    }

    return null;
  }, []);

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export default WebSocketContext;
