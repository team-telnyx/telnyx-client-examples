/*
 * The Telnyx WebRTC client uses On-Demand Credentials to register
 * the client. This allows you to support multiple clients with one
 * Telnyx SIP Connection.
 *
 * To read more about On-Demand Credentials: https://developers.telnyx.com/docs/v2/webrtc
 */
import axios from 'axios';

export function getTelephonyCredentials(params: {
  connection_id: string | undefined;
}) {
  return axios({
    method: 'POST',
    url: 'https://api.telnyx.com/v2/telephony_credentials',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    data: params,
  });
}

export function postTelephonyCredentialsToken(params: {
  credential_id: String;
}) {
  return axios({
    method: 'POST',
    url: `https://api.telnyx.com/v2/telephony_credentials/${params.credential_id}/token`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
  });
}
