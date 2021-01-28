import React, { Fragment, useRef, useEffect, useState } from 'react';
import Head from 'next/head';
import { TelnyxRTC } from '@telnyx/webrtc';
import { Box, Button, Form, FormField, TextInput } from 'grommet';

export default function Home() {
  const clientRef = useRef();
  const audioRef = useRef();
  const [isTelnyxReady, setIsTelnxyReady] = useState();
  const [sipUsername, setSipUsername] = useState();
  const [call, setCall] = useState();
  const [callLog, setCallLog] = useState([]);
  const [userFormValue, setUserFormValue] = useState({
    sipConnectionId: process.env.NEXT_PUBLIC_TELNYX_SIP_CONNECTION_ID || '',
    callerId: process.env.NEXT_PUBLIC_CALLER_ID || '',
  });
  const [callFormValue, setCallFormValue] = useState({
    destinationNumber: process.env.NEXT_PUBLIC_CALL_DESTINATION || '',
  });

  const connectClient = (creds) => {
    if (!creds.login_token) return;

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    clientRef.current = new TelnyxRTC({
      login_token: creds.login_token,
    });

    clientRef.current
      .on('telnyx.ready', () => {
        setIsTelnxyReady(true);
      })
      .on('telnyx.error', () => {
        setIsTelnxyReady(false);
      })
      .on('telnyx.notification', (notification) => {
        console.log('notification:', notification);

        if (notification.type === 'callUpdate') {
          const { call } = notification;
          setCall(call);

          console.log('call.telnyxIDs:', call.telnyxIDs);

          if (
            call.state === 'ringing' &&
            call.options.callerNumber === creds.sip_username &&
            call.options.callerNumber === call.options.destinationNumber
          ) {
            call.answer();
          }

          setCallLog((callLogState) => [
            {
              timestamp: Date.now(),
              text: call.state,
            },
            ...callLogState,
          ]);
        }
      });

    clientRef.current.connect();
  };

  const dial = async () => {
    const { data } = await fetch('/api/call-control/dial', {
      method: 'POST',
      body: JSON.stringify({
        to: callFormValue.destinationNumber,
        from: userFormValue.callerId,
        sip_username: sipUsername,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((resp) => resp.json());

    console.log('dial data:', data);
  };

  const hangup = () => {
    call.hangup();

    setCall(null);
  };

  const handleSubmitUserInfo = async (value) => {
    const creds = await fetch('/api/rtc/credentials', {
      method: 'POST',
      body: JSON.stringify({
        caller_id: userFormValue.callerId,
        connection_id: value.sipConnectionId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((resp) => resp.json());

    setSipUsername(creds.sip_username);

    // You'll also want to store this JWT somewhere
    connectClient(creds);
  };

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
