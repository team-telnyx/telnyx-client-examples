import React, { Fragment, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { TelnyxRTC } from '@telnyx/webrtc';
import { Box, Button, Form, FormField, TextInput } from 'grommet';

export default function Home() {
  const clientRef = useRef();
  const audioRef = useRef();
  const [isTelnyxReady, setIsTelnxyReady] = useState();
  const [loginToken, setLoginToken] = useState();
  const [call, setCall] = useState();
  const [callLog, setCallLog] = useState([]);
  const [userFormValue, setUserFormValue] = useState({
    sipConnectionId: process.env.NEXT_PUBLIC_TELNYX_SIP_CONNECTION_ID || '',
    callerId: process.env.NEXT_PUBLIC_CALLER_ID || '',
  });
  const [callFormValue, setCallFormValue] = useState({
    destinationNumber: process.env.NEXT_PUBLIC_CALL_DESITNATION || '',
  });

  const connectClient = (loginToken) => {
    if (!loginToken) return;

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    const client = new TelnyxRTC({
      login_token: loginToken,
    });

    client
      .on('telnyx.ready', () => {
        setIsTelnxyReady(true);
      })
      .on('telnyx.error', () => {
        setIsTelnxyReady(false);
      })
      .on('telnyx.notification', (notification) => {
        console.log('notification:', notification);

        if (notification.type === 'callUpdate') {
          setCall(notification.call);

          console.log('call.telnyxIDs:', notification.call.telnyxIDs);
        }

        console.log('callLog:', callLog);

        setCallLog([
          {
            timestamp: Date.now(),
            text: `${notification.type}${
              notification.call && notification.call.status
                ? ` - ${notification.call.status}`
                : ''
            }`,
          },
          ...callLog,
        ]);
      });

    client.connect();

    clientRef.current = client;
  };

  const dial = () => {
    const newCall = clientRef.current.newCall({
      destinationNumber: callFormValue.destinationNumber,
      callerNumber: userFormValue.callerId,
    });

    setCall(newCall);
  };

  const hangup = () => {
    call.hangup();

    setCall(null);
  };

  const handleSubmitUserInfo = async (value) => {
    const creds = await fetch('/api/rtc/credentials', {
      method: 'POST',
      body: JSON.stringify({
        connection_id: value.sipConnectionId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((resp) => resp.json());

    // You'll also want to store this JWT somewhere
    connectClient(creds.login_token);
  };

  console.log('call.status:', call && call.status);

  if (call && call.remoteStream) {
    audioRef.current.srcObject = call.remoteStream;
  }

  return (
    <Fragment>
      <Head>
        <title>Call Control + WebRTC Audio Test</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box pad="large" gap="small" fill>
        <Box>Call Control + WebRTC Audio Test</Box>

        <audio ref={audioRef} autoPlay />

        <Box direction="row" gap="large">
          <Box width="medium" gap="medium" pad="small">
            <Form
              value={userFormValue}
              onChange={setUserFormValue}
              onSubmit={({ value }) => handleSubmitUserInfo(value)}
            >
              <Box>User info</Box>

              <FormField label="SIP Connection ID">
                <TextInput
                  name="sipConnectionId"
                  placeholder="xxxxxxxxxxxxxxxx123"
                  required
                />
              </FormField>

              <FormField label="Caller ID">
                <TextInput
                  name="callerId"
                  type="tel"
                  placeholder="+15551231234"
                  required
                />
              </FormField>

              <Box>
                <Button type="submit" label="Connect" primary />
              </Box>
            </Form>

            <Form
              value={callFormValue}
              onChange={setCallFormValue}
              onSubmit={dial}
            >
              <FormField label="Call destination">
                <TextInput
                  name="destinationNumber"
                  type="tel"
                  placeholder="+15555675678"
                  required
                />
              </FormField>

              <Box direction="row" justify="center" gap="small">
                <Button
                  type="submit"
                  label="Start call"
                  primary
                  disabled={!isTelnyxReady}
                />
                <Button
                  label="Hangup"
                  onClick={hangup}
                  disabled={!isTelnyxReady}
                />
              </Box>
            </Form>
          </Box>

          <Box
            width="large"
            gap="medium"
            pad="small"
            background="light-2"
            round
          >
            <Box>Log</Box>

            <Box>
              <ul>
                {callLog.map(({ timestamp, text }) => (
                  <li key={timestamp}>
                    [{timestamp}] {text}
                  </li>
                ))}
              </ul>
            </Box>
          </Box>
        </Box>
      </Box>
    </Fragment>
  );
}
