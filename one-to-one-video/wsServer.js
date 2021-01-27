/**
 * Create a Websocket server to handle video data events,
 * e.g. to notify all clients when someone logs in
 */
const path = require('path');

require('dotenv').config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV.endsWith('local')
      ? `.env.${process.env.NODE_ENV}`
      : '.env'
  ),
});

const WebSocket = require('ws');

function init() {
  // Create or connect to WS server
  const wss = process.env.NEXT_PUBLIC_WS_SERVER_URL
    ? new WebSocket(process.env.NEXT_PUBLIC_WS_SERVER_URL)
    : new WebSocket.Server({ port: process.env.NEXT_PUBLIC_WS_SERVER_PORT });

  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(msgStr) {
      const msg = JSON.parse(msgStr);

      if (msg.notify_clients === true) {
        // Rebroadcast to all Websocket clients
        //
        // You'll want to segment this off in production and only
        // notify the client that invited a user by email, maybe
        // by creating a database to store clients + SIP username
        wss.clients.forEach(function (client) {
          client.send(msgStr);
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

  console.log('WebSocket server ready');
}

// Utils for heartbeat
function noop() {}

function heartbeat() {
  this.isAlive = true;
}

init();
