import fetch from 'node-fetch';

const TELNYX_API_URL = process.env.TELNYX_API_URL || 'https://api.telnyx.com';

export default async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Generate on-demand credential and token
      const credResponse = await fetch(
        `${TELNYX_API_URL}/v2/telephony_credentials`,
        {
          method: 'POST',
          body: JSON.stringify({
            connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          },
        }
      );

      const credData = await credResponse.json();

      if (!credData.data || credData.errors) {
        throw new Error('Error retrieving credentials');
      }

      // Generate a token that can be saved in browser storage
      const tokenResponse = await fetch(
        `${TELNYX_API_URL}/v2/telephony_credentials/${credData.data.id}/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          },
        }
      );

      const tokenStr = await tokenResponse.text();

      res.statusCode = 200;
      res.send({
        sip_username: credData.data.sip_username,
        login_token: tokenStr,
      });
    } else {
      res.statusCode = 405;
      res.json({ error: 'Method Not Allowed' });
    }
  } catch (e) {
    console.log('api/rtc/credentials: ', e);

    res.statusCode = 500;
    res.json({ error: 'Internal Server Error' });
  }
};
