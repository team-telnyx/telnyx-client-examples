// The Telnyx Call Control API expects the client state to be
// base64 encoded, so we have our encode/decode helpers here
export function encodeClientState(data) {
  let jsonStr = JSON.stringify(data);
  let buffer = Buffer.from(jsonStr);

  return buffer.toString('base64');
}

export function decodeClientState(data) {
  if (!data) return {};

  let buffer = Buffer.from(data, 'base64');
  let str = buffer.toString('ascii');

  return JSON.parse(str);
}

export default encodeClientState;
