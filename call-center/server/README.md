# Call Center Server

## Quick start

```sh
npm install
npm run setup
npm start
```

This will start an Express app on port specified as the `TELNYX_SERVER_APP_PORT` environment variable (defaults to `8000`).

## App configuration

1. (ngrok) Download and install [ngrok](https://ngrok.com/). Start up ngrok with `ngrok http 8000` and make note of the https `Forwarding` URL.
1. (Mission Control) Log in to Telnyx Mission Control and [buy a phone number](https://portal.telnyx.com/#/app/numbers/search-numbers). This is your Call Center phone number that end users will call to reach your application.
1. (Mission Control) Create a [Call Control App](https://portal.telnyx.com/#/app/call-control/applications/new). Set the required webhook URL to `https://your-ngrok-forwarding-id.ngrok.io/call-control/callbacks`. Make note of the ID of your new Call Control App.
1. (Mission Control) [Update your phone number](https://portal.telnyx.com/#/app/numbers/my-numbers) by selecting your Call Control App under "Connection or App".
1. (Mission Control) [Create a SIP connection](https://portal.telnyx.com/#/app/connections), setting the "SIP Connection Type" to `Credentials`. Enable "Receive SIP URI Calls" in the "Inbound" tab. Make note of your SIP Connection ID.
1. (Mission Control) [Create an Outbound Voice Profile](https://portal.telnyx.com/#/app/outbound-profiles/new), associating it with your Call Control App. Make note of the Outbound Voice Profile ID.
1. (app) Update your .env file with information noted from previous steps.
1. (app) Start your app with `npm start`
1. (shell) Login to your app with `curl -X POST https://your-ngrok-forwarding-id.ngrok.io/agents/login`
1. (ngrok) Open the ngrok Web Interface (ex: <http://127.0.0.1:4040/inspect/http>). You should see `/login` request.
1. (ngrok) Call your Call Center phone number from your personal device or a web dialer. You should see requests to `POST /call-control/callbacks` come through. (Note: Events may not show up in the expected order, e.g. `initiated` may be logged after `call`.)

## Demo web dialer configuration

You can use the [Telnyx RTC Web Dialer Demo](https://webrtc.telnyx.com/rtc/index.html) to test inbound calls to the server app.

1. Use token returned from `POST /agents/login` as the "Login Token" to authenticate the web dialer
1. Set "Caller ID Number" to your Call Center phone number.
