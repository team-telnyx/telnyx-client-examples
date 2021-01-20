import fetch from 'node-fetch';

export default async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Generate on-demand credential.
      // By default, on-demand credentials expire after 24 hours
      const credResponse = await fetch(
        'https://api.telnyx.com/v2/telephony_credentials',
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

      const { data: credData } = await credResponse.json();

      // Generate a token that can be saved in browser storage
      const tokenResponse = await fetch(
        `https://api.telnyx.com/v2/telephony_credentials/${credData.id}/token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          },
        }
      );

      console.log('tokenResponse:', tokenResponse);

      res.statusCode = 200;
      res.json({ token: tokenResponse, expires_at: credData.expires_at });
    } else {
      res.statusCode = 405;
      res.json({ error: 'Method Not Allowed' });
    }
  } catch (e) {
    res.statusCode = 500;
    res.json({ error: 'Internal Server Error' });
  }
};
