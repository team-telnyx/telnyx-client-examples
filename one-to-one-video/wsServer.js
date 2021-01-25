/**
 * Create a Websocket server to handle video data events,
 * e.g. to initiate a call when someone logs in
 */
const path = require('path');

require('dotenv').config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === 'local' ? '.env.local' : '.env'
  ),
});

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create or connect to WS server
const wss = process.env.NEXT_PUBLIC_WS_SERVER_URL
  ? new WebSocket(process.env.NEXT_PUBLIC_WS_SERVER_URL)
  : new WebSocket.Server({ port: process.env.NEXT_PUBLIC_WS_SERVER_PORT });

// Track client data in memory (development only) so we know who to call
// You'll want to replace this solution with a database or similar in production
// Client shape:
// [email]: {
//   ws_id: '',
//   status: '',
//   sip_username: '',
//   invited_by: ''
// }
// Assume one user session = one websocket connection for now
const clientsDB = new Map();

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msgStr) {
    ws.uuid = ws.uuid || uuidv4();

    const msg = JSON.parse(msgStr);

    clientsDB.set(
      msg.user_email,
      Object.assign(clientsDB.get(msg.user_email) || {}, {
        ws_id: ws.uuid,
        status: msg.status,
        sip_username: msg.sip_username,
      })
    );

    if (msg.status === 'invited_email') {
      // Create a client entry for invitee
      // TODO check if invitee is already logged in
      clientsDB.set(
        msg.invite_email,
        Object.assign(clientsDB.get(msg.invite_email) || {}, {
          ws_id: ws.uuid,
          status: msg.status,
          sip_username: msg.sip_username,
          invited_by: msg.user_email,
        })
      );
    }

    if (msg.status === 'webrtc_ready') {
      const clientData = clientsDB.get(msg.user_email);

      if (clientData.invited_by) {
        // Notify inviter Websocket client that invitee has logged in
        const inviterClientData = clientsDB.get(clientData.invited_by);

        if (inviterClientData) {
          wss.clients.forEach(function (client) {
            if (
              client.uuid === inviterClientData.ws_id &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(
                JSON.stringify({
                  status: 'initiate_dial',
                  to_sip_username: clientData.sip_username,
                })
              );
            }
          });
        }
      }
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
