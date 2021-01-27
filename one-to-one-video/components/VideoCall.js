import React, {
  Fragment,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import { TelnyxRTCContext, useCallbacks } from '@telnyx/react-client';
import { Avatar, Box, Button, Grid, Paragraph, Video, Text } from 'grommet';
import {
  Video as VideoIcon,
  Microphone,
  RadialSelected,
  Phone,
} from 'grommet-icons';
import InviteEmailForm from './InviteEmailForm';

export default function VideoCall({ serverMessage, onTelnyxReady }) {
  const router = useRouter();
  const telnyxClient = useContext(TelnyxRTCContext);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
  const [invitedEmail, setInvitedEmail] = useState(router.query.invitedEmail);
  const [call, setCall] = useState();

  useCallbacks({
    onNotification: (notification) => {
      if (notification.type == 'userMediaError') {
        setIsWebcamAvailable(false);
      }

      if (notification.type == 'callUpdate') {
        const { call } = notification;

        if (call) {
          if (call.state === 'ringing') {
            call.answer();
          }

          if (call.state === 'destroy') {
            setCall(null);
          } else {
            setCall(call);
          }
        }
      }
    },
    onReady: () => {
      onTelnyxReady();
    },
    onError: (err) => {
      console.error('VideoCall err:', err);
    },
  });

  useEffect(() => {
    console.log('VideoCall serverMessage:', serverMessage);

    if (
      serverMessage &&
      serverMessage.status === 'user_rtc_ready' &&
      serverMessage.user_email === invitedEmail
    ) {
      if (router.query.disableCalling) {
        console.warn('Calling is disabled with `disableCalling` in the URL');
      } else {
        const newCall = telnyxClient.newCall({
          destinationNumber: `sip:${serverMessage.sip_username}@sipdev.telnyx.com`,
          audio: true,
          video: true,
        });
        setCall(newCall);
      }
    }
  }, [serverMessage]);

  const checkVideo = async () => {
    let result = await telnyxClient.getVideoDevices();

    if (result.length) {
      setIsWebcamAvailable(true);

      if (navigator.mediaDevices.getUserMedia) {
        // Set local video stream to default webcam
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            localVideoEl.current.srcObject = stream;

            // Wait for stream to load
            localVideoEl.current.addEventListener('loadeddata', () => {
              setIsWebcamOn(true);
            });
          })
          .catch((error) => {
            console.log(error);
          });
      }
    } else {
      setIsWebcamAvailable(false);
    }
  };

  const handleInviteSubmit = ({ email }) => {
    setInvitedEmail(email);

    // Save email in query string
    router.push({ query: { invitedEmail: email } });
  };

  const hangup = () => {
    if (call) {
      call.hangup();
    }
  };

  if (call) {
    if (call.localStream)
      localVideoEl.current.srcObject = call.options.localStream;
    if (call.remoteStream)
      remoteVideoEl.current.srcObject = call.options.remoteStream;
  }

  const isCallActive = call?.state === 'active';

  return (
    <Box gap="medium">
      <Box direction="row" gap="medium" align="center">
        <Box>
          <Box background="light-2" width="640px" height="400px">
            <Video
              ref={localVideoEl}
              controls={false}
              fit="cover"
              autoPlay
              mute
            />

            {!isCallActive && !isWebcamAvailable && (
              <Box fill align="center" justify="center">
                {isWebcamAvailable === undefined && (
                  <Paragraph>Want to check yourself out?</Paragraph>
                )}
                {isWebcamAvailable === false && (
                  <Paragraph>No webcam detected. Is it on?</Paragraph>
                )}
                <Button
                  size="large"
                  icon={<VideoIcon />}
                  label="Test your video"
                  onClick={checkVideo}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Box>
          <Box background="neutral-2" width="640px" height="400px">
            <Video ref={remoteVideoEl} controls={false} fit="cover" autoPlay />

            {!isCallActive && (
              <Fragment>
                {invitedEmail && (
                  <Box fill align="center" justify="center">
                    {call && (
                      <Paragraph>{invitedEmail} is joining...</Paragraph>
                    )}
                    {!call && (
                      <Paragraph>
                        Waiting for {invitedEmail} to join...
                      </Paragraph>
                    )}
                  </Box>
                )}
                {!invitedEmail && (
                  <Box fill align="center" justify="center">
                    {isWebcamOn && (
                      <Paragraph>
                        You look great! Now, invite someone to video chat
                      </Paragraph>
                    )}

                    <InviteEmailForm
                      emailLabel="Enter email to invite"
                      submitLabel="Send link to chat"
                      onSubmit={handleInviteSubmit}
                    />
                  </Box>
                )}
              </Fragment>
            )}
          </Box>
        </Box>
      </Box>

      <Grid columns={['flex', 'auto', 'flex']}>
        <Box align="start" gap="small">
          <Button onClick={() => {}} tip="Record call">
            <Avatar background="status-disabled">
              <RadialSelected />
            </Avatar>
          </Button>
        </Box>

        <Box direction="row" gap="small">
          <Button onClick={() => {}} tip="Toggle your microphone">
            <Avatar background="accent-3">
              <Microphone />
            </Avatar>
          </Button>
          <Button onClick={() => {}} tip="Toggle your video">
            <Avatar background="accent-3">
              <VideoIcon />
            </Avatar>
          </Button>
          <Button onClick={hangup} tip="End call">
            <Avatar background="status-error">
              <Phone />
            </Avatar>
          </Button>
        </Box>
      </Grid>
    </Box>
  );
}
