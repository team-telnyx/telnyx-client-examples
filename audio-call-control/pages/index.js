import React, { Fragment, useRef, useEffect, useState } from 'react';
import Head from 'next/head';
import { TelnyxRTC } from '@telnyx/webrtc';
import { Box, Button, Form, FormField, TextInput } from 'grommet';

export default function Home() {
  const [loginToken, setLoginToken] = useState('');
  const [userInfo, setUserInfo] = useState();
  const [formValue, setFormValue] = useState({
    sipConnectionId: process.env.NEXT_PUBLIC_TELNYX_SIP_CONNECTION_ID || '',
    callerId: process.env.NEXT_PUBLIC_CALLER_ID || '',
    callDestination: process.env.NEXT_PUBLIC_CALL_DESITNATION || '',
  });
  const [call, setCall] = useState();
  const clientRef = useRef();

  useEffect(() => {
    if (!loginToken) return;

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    const client = new TelnyxRTC({
      login_token: token,
    });

    client.remoteElement = 'remoteAudio';

    client
      .on('telnyx.ready', () => console.log('ready to call'))
      .on('telnyx.error', () => console.log('error'))
      .on('telnyx.notification', (notification) => {
        if (notification.type === 'callUpdate') {
          setCall(notification.call);
        }
      });

    client.connect();

    clientRef.current = client;
  }, [loginToken]);

  console.log('call.status:', call && call.status);

  const dial = () => {
    const newCall = clientRef.current.newCall({
      destinationNumber: '18004377950',
      callerNumber: '‬155531234567',
    });

    setCall(newCall);
  };

  const hangup = () => {
    call.hangup();

    setCall(null);
  };

  const handleSubmit = (value) => {
    console.log('value:', value);

    setUserInfo(value);
  };

  return (
    <Fragment>
      <Head>
        <title>Call Control + WebRTC Audio Test</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box pad="large" gap="small" fill>
        <Box>Call Control + WebRTC Audio Test</Box>

        <audio id="remoteAudio" autoPlay />

        <Box direction="row" gap="large">
          <Box width="medium" gap="medium" pad="small">
            <Form
              value={formValue}
              onChange={setFormValue}
              onSubmit={({ value }) => handleSubmit(value)}
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

              <FormField label="Call destination">
                <TextInput
                  name="callDestination"
                  type="tel"
                  placeholder="+15555675678"
                  required
                />
              </FormField>

              <Box>
                <Button type="submit" label="Connect" primary />
              </Box>
            </Form>

            <Box direction="row" justify="center" gap="small">
              <Button label="Call" onClick={dial} primary />
              <Button label="Hangup" onClick={hangup} />
            </Box>
          </Box>

          <Box
            width="medium"
            gap="medium"
            pad="small"
            background="light-2"
            round
          >
            <Box>Log</Box>

            <Box>TBD</Box>
          </Box>
        </Box>
      </Box>
    </Fragment>
  );
}
