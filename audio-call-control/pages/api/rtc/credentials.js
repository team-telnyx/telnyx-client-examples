import fetch from 'node-fetch';

// Generate on-demand credential and token
export default async (req, res) => {
  console.log('/api/rtc/credentials req.body:', req.body);

  const payload = req.body;

  try {
    let credResp = await fetch(
      `https://api.telnyx.com/v2/telephony_credentials`,
      {
        method: 'POST',
        body: JSON.stringify({
          connection_id: payload.connection_id,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      }
    ).then((resp) => resp.json());

    let credData = credResp.data;

    if (!credData || credResp.errors) {
      throw new Error('Error retrieving credentials');
    }

    // Save SIP username by caller ID in database
    await fetch('http://localhost:3000/api/rtc/clients', {
      method: 'POST',
      body: JSON.stringify({
        caller_id: payload.caller_id,
        sip_username: credData.sip_username,
        logged_in: true,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    const tokenStr = await tokenResponse.text();

    res.statusCode = 200;
    res.send({
      sip_username: credData.sip_username,
      login_token: tokenStr,
    });
  } catch (e) {
    console.log('/api/rtc/credentials: ', e);

    res.statusCode = 500;
    res.json({ error: 'Internal Server Error' });
  }
};
