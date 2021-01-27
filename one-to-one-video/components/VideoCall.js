import React, {
  Fragment,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import { TelnyxRTCContext, useCallbacks } from '@telnyx/react-client';
import {
  Box,
  Button,
  Form,
  Grid,
  Paragraph,
  Video,
  Text,
  TextInput,
} from 'grommet';
import {
  Video as VideoIcon,
  Microphone,
  RadialSelected,
  Close,
  Checkmark,
  FormEdit,
} from 'grommet-icons';
import InviteEmailForm from './InviteEmailForm';

// TODO use same constants as `pages/api/texml`
const START_RECORDING_DTMF_KEY = '1';
const END_RECORDING_DTMF_KEY = '0';

/**
 * Display local and remote videos
 */
export default function VideoCall({
  userEmail,
  displayName,
  serverMessage,
  onTelnyxReady,
  onDial,
  onDisplayNameChange,
}) {
  const router = useRouter();
  const telnyxClient = useContext(TelnyxRTCContext);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
  const [participantEmail, setParticipantEmail] = useState(
    router.query.invitedEmail
  );
  const [call, setCall] = useState();
  const [isEditingDisplayName, setIsEditingDisplayName] = useState();
  const [participantName, setParticipantName] = useState();

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
            setParticipantEmail(null);
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

    if (!serverMessage) {
      return;
    }

    switch (serverMessage.status) {
      case 'user_rtc_ready': {
        if (serverMessage.user_email === participantEmail) {
          const newCall = telnyxClient.newCall({
            destinationNumber: `sip:${serverMessage.sip_username}@${process.env.NEXT_PUBLIC_TELNYX_SIP_SUBDOMAIN}.${process.env.NEXT_PUBLIC_TELNYX_SIP_DOMAIN}`,
            audio: true,
            video: true,
          });

          setCall(newCall);

          onDial(participantEmail);
        }

        break;
      }
      case 'user_initiated_dial': {
        if (serverMessage.destination_user_email === userEmail) {
          setParticipantEmail(serverMessage.user_email);
        }
        break;
      }
      case 'user_name_change': {
        if (
          serverMessage.user_email === participantEmail ||
          serverMessage.user_email === participantEmail
        ) {
          setParticipantName(serverMessage.display_name);
        }
        break;
      }
      default:
        break;
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
    setParticipantEmail(email);

    // Save email in query string
    router.push({ query: { invitedEmail: email } });
  };

  if (call) {
    if (call.localStream)
      localVideoEl.current.srcObject = call.options.localStream;
    if (call.remoteStream)
      remoteVideoEl.current.srcObject = call.options.remoteStream;
  }

  const isCallActive = call && call.state === 'active';

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

  const participantDisplayName = participantName || participantEmail;

  return (
    <Box gap="medium">
      <Box direction="row" gap="medium" align="start">
        <Box style={{ position: 'relative' }}>
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

            <Box style={{ position: 'absolute', top: 0, left: 0, zIndex: 99 }}>
              <Box
                background="light-4"
                color="dark-3"
                pad={{ left: 'small', right: 'xsmall' }}
                margin="xsmall"
                round
              >
                {isEditingDisplayName && (
                  <Form
                    onSubmit={({ value }) => {
                      onDisplayNameChange(value.display_name || displayName);
                      setIsEditingDisplayName(false);
                    }}
                  >
                    <Box direction="row" gap="small">
                      <TextInput
                        name="display_name"
                        placeholder={displayName}
                        size="small"
                        plain
                      />
                      <Button
                        type="submit"
                        icon={<Checkmark size="small" color="status-ok" />}
                        size="small"
                      />
                    </Box>
                  </Form>
                )}
                {!isEditingDisplayName && (
                  <Box direction="row" align="center" gap="xsmall">
                    <Text size="xsmall">{displayName}</Text>
                    <Button
                      icon={<FormEdit color="status-ok" />}
                      onClick={() => {
                        setIsEditingDisplayName(true);
                      }}
                      plain
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box gap="medium" style={{ position: 'relative' }}>
          <Box background="neutral-2" {...videoProps} {...remoteVideoProps}>
            <Video ref={remoteVideoEl} controls={false} fit="cover" autoPlay />

            {!isCallActive && (
              <Fragment>
                {participantEmail && (
                  <Box fill align="center" justify="center">
                    {call && (
                      <Paragraph>{participantEmail} is joining...</Paragraph>
                    )}
                    {!call && (
                      <Paragraph>
                        Waiting for {participantEmail} to join...
                      </Paragraph>
                    )}
                  </Box>
                )}
                {!participantEmail && (
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

          <Box style={{ position: 'absolute', top: 0, left: 0, zIndex: 99 }}>
            {participantDisplayName && (
              <Box
                background="light-4"
                color="dark-3"
                pad={{ horizontal: 'small' }}
                margin="xsmall"
                round
              >
                <Text size="xsmall">{participantDisplayName}</Text>
              </Box>
            )}
          </Box>

          {call && (
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
