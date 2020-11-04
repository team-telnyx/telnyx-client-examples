/* Set up your application */
const fs = require('fs');
const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

async function setup() {
  if (!process.env.NGROK_SUBDOMAIN) {
    console.log('No ngrok subdomain specified, not continuing with setup');
    return;
  }

  let appName = process.env.APP_NAME || 'Sample - Call Center App';
  let callControlId = process.env.TELNYX_CC_APP_ID;

  if (!callControlId) {
    try {
      const {
        data: callControlApp,
      } = await telnyx.callControlApplications.create({
        application_name: appName,
        webhook_event_url: `https://${process.env.NGROK_SUBDOMAIN}.ngrok.io/call-control/callbacks`,
        webhook_api_version: '2',
        // Hangup after default timeout of 30 seconds
        // Prevents long calls during development
        first_command_timeout: true,
      });

      await fs.appendFile(
        './.env',
        `\nTELNYX_CC_APP_ID=${callControlApp.id}`,
        'utf8',
        (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log(
              `Telnyx Call Control App "${appName}" successfully created`
            );
          }
        }
      );

      callControlId = callControlApp.id;
    } catch (err) {
      console.log(err);

      if (err.raw && err.raw.errors) {
        console.log('Server error:', err.raw.errors[0]);
      }
    }
  }

  let phoneNumber = process.env.TELNYX_SIP_OB_NUMBER;

  if (!phoneNumber) {
    console.log(
      'No phone number specified, buy a phone number in portal.telnyx.com and manually add your call control application'
    );
  } else {
    let phoneNumberId;

    try {
      let { data: phoneNumbers } = await telnyx.phoneNumbers.list({
        filter: { phone_number: phoneNumber },
        page: {
          number: 1,
          size: 1,
        },
      });

      phoneNumberId = phoneNumbers[0].id;
    } catch (err) {
      console.error(err);

      if (err.raw && err.raw.errors) {
        console.log('Server error:', err.raw.errors[0]);
      }
    }

    if (phoneNumberId) {
      try {
        const { data: phoneNumber } = await telnyx.phoneNumbers.update(
          phoneNumberId,
          {
            connection_id: callControlId,
            tags: ['Development'],
          }
        );

        console.log(
          'Successfully assigned call control application to phone number'
        );
      } catch (err) {
        console.error(err);

        if (err.raw && err.raw.errors) {
          console.log('Server error:', err.raw.errors[0]);
        }
      }
    }
  }
}

setup();
