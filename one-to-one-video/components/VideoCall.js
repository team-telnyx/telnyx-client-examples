import React, {
  Fragment,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import { TelnyxRTCContext, useCallbacks } from '@telnyx/react-client';
import { Box, Button, Grid, Paragraph, Video, Text } from 'grommet';
import {
  Video as VideoIcon,
  Microphone,
  RadialSelected,
  Close,
} from 'grommet-icons';
import InviteEmailForm from './InviteEmailForm';

// TODO use same constants as `pages/api/texml`
const START_RECORDING_DTMF_KEY = '1';
const END_RECORDING_DTMF_KEY = '0';

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

          if (call.state === 'hangup') {
            setInvitedEmail(null);
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
    console.log('VideoCall call:', call);
  }, [call]);

  useEffect(() => {
    console.log('VideoCall serverMessage:', serverMessage);

    if (
      serverMessage &&
      serverMessage.status === 'user_rtc_ready' &&
      serverMessage.user_email === invitedEmail
    ) {
      const newCall = telnyxClient.newCall({
        destinationNumber: `sip:${serverMessage.sip_username}@sipdev.telnyx.com`,
        audio: true,
        video: true,
      });

      setCall(newCall);
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

  if (call) {
    if (call.localStream)
      localVideoEl.current.srcObject = call.options.localStream;
    if (call.remoteStream)
      remoteVideoEl.current.srcObject = call.options.remoteStream;
  }

  const isCallActive = call?.state === 'active';

  const videoProps = {
    width: '640px',
    height: '400px',
    round: 'xsmall',
    overflow: 'hidden',
  };
  const localVideoProps = isCallActive && {
    width: '240px',
    height: '150px',
    round: true,
  };
  const remoteVideoProps = isCallActive && {
    width: '960px',
    height: '600px',
  };

  return (
    <Box gap="medium">
      <Box direction="row" gap="medium" align="start">
        <Box>
          <Box background="light-2" {...videoProps} {...localVideoProps}>
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

        <Box gap="medium">
          <Box background="neutral-2" {...videoProps} {...remoteVideoProps}>
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

          {isCallActive && (
            <Grid columns={['flex', 'auto', 'flex']}>
              <Box align="start" gap="medium">
                <Box
                  round="full"
                  overflow="hidden"
                  background="status-disabled"
                >
                  <Button
                    icon={<RadialSelected />}
                    onClick={() => {
                      call.dtmf(START_RECORDING_DTMF_KEY);
                    }}
                    hoverIndicator
                    tip="Start recording call"
                  ></Button>
                </Box>
              </Box>

              <Box direction="row" gap="medium">
                <Box round="full" overflow="hidden" background="accent-3">
                  <Button
                    icon={<Microphone />}
                    onClick={() => {
                      call.toggleAudioMute();
                    }}
                    hoverIndicator
                    tip="Toggle your microphone"
                  ></Button>
                </Box>
                <Box round="full" overflow="hidden" background="accent-3">
                  <Button
                    icon={<VideoIcon />}
                    onClick={() => {
                      call.toggleVideoMute();
                    }}
                    hoverIndicator
                    tip="Toggle your camera"
                  ></Button>
                </Box>
                <Box round="full" overflow="hidden" background="status-error">
                  <Button
                    icon={<Close />}
                    onClick={() => {
                      call.hangup();
                    }}
                    hoverIndicator
                    tip="End call"
                  ></Button>
                </Box>
              </Box>
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
