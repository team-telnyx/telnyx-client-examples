/* Run configs before each startup */
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function prestart() {
  if (!process.env.NGROK_SUBDOMAIN) {
    return;
  }

  try {
    const {
      data: callControlApp,
    } = await telnyx.callControlApplications.retrieve(
      process.env.TELNYX_CC_APP_ID
    );

    await callControlApp.update({
      webhook_event_url: `https://${process.env.NGROK_SUBDOMAIN}.ngrok.io/call-control/callbacks`,
    });
  } catch (err) {
    console.error(err);
  }
}

prestart();
