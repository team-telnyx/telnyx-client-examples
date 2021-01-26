import React, { useContext, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TelnyxRTCContext, useCallbacks } from '@telnyx/react-client';
import { Box, Button, Paragraph, Video } from 'grommet';
import { Video as VideoIcon } from 'grommet-icons';
import InviteEmailForm from './InviteEmailForm';

export default function VideoCall({
  serverMessage,
  onTelnyxReady,
  onEmailInvite,
}) {
  const router = useRouter();
  const telnyxClient = useContext(TelnyxRTCContext);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
  const [invitedEmail, setInvitedEmail] = useState(router.query.invitedEmail);
  const [remoteVideoStream, setRemoteVideoStream] = useState();

  useCallbacks({
    onNotification: (notification) => {
      console.log('VideoCall onNotification: ', notification);
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

    if (serverMessage && serverMessage.status === 'initiate_dial') {
      telnyxClient.newCall({
        destinationNumber: `sip:${serverMessage.to_sip_username}@${process.env.NEXT_PUBLIC_TELNYX_SIP_DOMAIN}`,
        audio: true,
        video: true,
      });
    }
  }, [serverMessage]);

  useEffect(() => {
    if (isWebcamAvailable) {
      // TODO move to sdk?
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
    }
  }, [isWebcamAvailable]);

  const checkVideo = async () => {
    telnyxClient.localElement = localVideoEl.current;

    let result = await telnyxClient.getVideoDevices();

    if (result.length) {
      setIsWebcamAvailable(true);
    } else {
      setIsWebcamAvailable(false);
    }
  };

  const handleInviteSubmit = ({ email }) => {
    setInvitedEmail(email);

    // Save email in query string
    router.push({ query: { invitedEmail: email } });

    onEmailInvite(email);
  };

  return (
    <Box direction="row" gap="medium" align="center">
      <Box background="light-2" width="640px" height="400px">
        <Video ref={localVideoEl} controls={false} fit="cover" autoPlay mute />

        {!isWebcamAvailable && (
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

      <Box background="neutral-2" width="640px" height="400px">
        {invitedEmail && remoteVideoStream && (
          <Video
            ref={remoteVideoEl}
            controls={false}
            fit="cover"
            autoPlay
            mute
          />
        )}

        {invitedEmail && !remoteVideoStream && (
          <Box fill align="center" justify="center">
            <Paragraph>Waiting for {invitedEmail} to join...</Paragraph>
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
      </Box>
    </Box>
  );
}
