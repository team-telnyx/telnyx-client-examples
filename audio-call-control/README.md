# Call Center Example

Example app that shows how to make programmable phone calls to and from one PSTN number, to/from multiple WebRTC clients.

## Telnyx Portal setup

1. Create an Outbound Profile
2. Create a SIP Connection
   - Set **SIP Connection Type** to "Credentials"
   - Under **Inbound** tab, change **Receive SIP URI Calls** to "From Anyone"
   - Under **Outbound** tab, choose outbound profile from step 1
3. Create Call Control Application
   - Set webhook URL to `https://<your-host>/api/call-control/webhook` (tip: use [ngrok](https://ngrok.com/) to make your local app available publicly during development)
   - Set inbound subdomain to `simple-cc-demo`
   - Choose outbound profile from step 1 in **Outbound Settings**
4. Buy a phone number
   - Set **Connection or App** to your Call Control app created in step 3

Assumptions:

- One phone number (i.e. caller ID) = One SIP Connection (i.e. username/password) = One or many Telephony Credential (i.e. SIP username) = One or many Access Tokens (i.e. WebRTC login token)
- Database stores caller ID and SIP username to match inbound calls

Scenarios:

1. User A at Company A logs in to WebRTC client, is assigned unique SIP username and access token
2. User B at Company A logs in to WebRTC client, is assigned unique SIP username and access token
3. Caller dials Company A's phone number. Call is routed to either User A or User B's WebRTC client (logic for choosing the user-agent is not implemented in this example)

4. User A at Company A logs in to WebRTC client, is assigned unique SIP username and access token
5. User A initiates dial to Callee through the server
6. Server creates 2 calls: dial User A WebRTC client directly, and dial to Callee
7. User A's WebRTC client answers automatically, joining call with Callee

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
