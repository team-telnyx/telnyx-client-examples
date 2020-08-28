import express from 'express';
import axios from 'axios';

let router = express.Router();

router.post('/login', async function (req, res) {
  try {
    let credential = await axios({
      method: 'POST',
      url: 'https://api.telnyx.com/v2/telephony_credentials',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      },
      data: {
        connection_id: process.env.TELNYX_CONNECTION_ID,
      },
    });

    let token = await axios({
      method: 'POST',
      url: `https://api.telnyx.com/v2/telephony_credentials/${credential.data.data.id}/token`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      },
      data: {},
    });

    res.json({ token: token.data, credential: credential.data.data });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

export default router;
