import fetch from 'node-fetch';

const TELNYX_API_URL = 'https://api.telnyx.com';

export default async (req, res) => {
  console.log('/api/rtc/credentials req.body:', req.body);

  const payload = req.body;

  try {
    // Generate on-demand credential and token
    const credName = `caller_id_e164:${payload.caller_id}`;

    let credResp = await fetch(
      `${TELNYX_API_URL}/v2/telephony_credentials?filter[name]=${encodeURIComponent(
        credName
      )}&filter[status]=active&page[number]=1&page[size]=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      }
    ).then((resp) => resp.json());

    let credData = credResp.data;

    if (!credData || !credData.length) {
      credResp = await fetch(`${TELNYX_API_URL}/v2/telephony_credentials`, {
        method: 'POST',
        body: JSON.stringify({
          name: credName,
          connection_id: payload.connection_id,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      }).then((resp) => resp.json());

      credData = credResp.data;
    } else {
      credData = credResp.data[0];
    }

    if (!credData || credResp.errors) {
      throw new Error('Error retrieving credentials');
    }

    // Generate a token that can be saved in browser storage
    const tokenResponse = await fetch(
      `${TELNYX_API_URL}/v2/telephony_credentials/${credData.id}/token`,
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
