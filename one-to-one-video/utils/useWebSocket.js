import { useMemo } from 'react';

/**
 * Connect to the Websocket data channel to receive custom notifications,
 * e.g. when someone joins the video chat
 */
export default function useWebSocket() {
  // TODO context
  return useMemo(() => {
    if (typeof window !== 'undefined') {
      // TODO custom port
      const ws = new window.WebSocket('ws://localhost:8080');

      // ws.addEventListener('open', () => {
      //   console.log('ws open');
      // });

      ws.addEventListener('message', ({ data }) => {
        console.log('ws message:', data);
      });

      return ws;
    }

    return null;
  }, []);
}
