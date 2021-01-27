/**
 * Setup WebSockets with custom Next.js server
 * See https://nextjs.org/docs/advanced-features/custom-server
 */
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

require('dotenv').config({
  path: path.resolve(
    process.cwd(),
    process.env.LOCAL_ENV ? `.env.${process.env.LOCAL_ENV}` : '.env'
  ),
});

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create server for Next.js API
  const appServer = createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);

    handle(req, res, parsedUrl);
  });
  // Create WebSocket server to exchange data between clients
  const wss = new WebSocket.Server({
    server: appServer,
    path: `/${process.env.NEXT_PUBLIC_WS_SERVER_PATH.replace(/^\//, '')}`,
  });

  wss.on('connection', function connection(ws, req) {
    const wsIP = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(/\s*,\s*/)[0]
      : req.socket.remoteAddress;

    console.log('WebSocket client connected: ', wsIP);

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

  appServer.listen(process.env.NEXT_API_PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${process.env.NEXT_API_PORT}`);
  });
});

// Utils for WebSocket heartbeat
function noop() {}
function heartbeat() {
  this.isAlive = true;
}
