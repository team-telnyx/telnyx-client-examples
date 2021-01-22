/**
 * Create a Websocket server for the video call data channel,
 * e.g. when someone joins the video chat
 */
const path = require('path');
const WebSocket = require('ws');

require('dotenv').config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'local' ? '.env.local' : '.env'
  ),
});

// Create or connect to WS server
const wss = process.env.NEXT_PUBLIC_WS_SERVER_URL
  ? new WebSocket(process.env.NEXT_PUBLIC_WS_SERVER_URL)
  : new WebSocket.Server({ port: process.env.NEXT_PUBLIC_WS_SERVER_PORT });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(dataStr) {
    const data = JSON.parse(dataStr);

    if (data.status === 'webrtc_ready') {
      // Notify all Websocket clients that someone has logged in
      // In production, you'll want to add some sort of segmentation logic
      // to only notify clients that are waiting for an accepted invite
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  // Set up ping-pong to detect and close broken connections
  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});

// Utils for heartbeat
function noop() {}

function heartbeat() {
  this.isAlive = true;
}
