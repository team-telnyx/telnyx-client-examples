import dotenv from 'dotenv';
dotenv.config();

import { createConnection } from 'typeorm';

import createApp from './helpers/createApp';

createConnection().then(function () {
  let app = createApp();

  app.listen(process.env.TELNYX_SERVER_APP_PORT, function () {
    console.log(
      `App is listening on port ${process.env.TELNYX_SERVER_APP_PORT}`
    );
  });
});
