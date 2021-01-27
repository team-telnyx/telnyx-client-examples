import { useContext } from 'react';
import WebSocketContext from './WebSocketContext';

/**
 * Connect to the Websocket data channel to receive custom notifications,
 * e.g. when someone joins the video chat
 */
export default function useWebSocket() {
  const ws = useContext(WebSocketContext);

  return ws;
}
