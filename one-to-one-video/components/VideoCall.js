import { useContext, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/client';
import { TelnyxRTCContext, useCallbacks } from '@telnyx/react-client';
import { Box, Button, Paragraph, Video } from 'grommet';
import { Video as VideoIcon } from 'grommet-icons';
import useCachedCredentials from '../utils/useCachedCredentials';
import useWebSocket from '../utils/useWebSocket';
import EmailSignIn from './EmailSignIn';

export default function VideoCall() {
  const [session] = useSession();
  const [cachedCredentials, setCachedCredentials] = useCachedCredentials();
  const router = useRouter();
  const ws = useWebSocket();
  const telnyxClient = useContext(TelnyxRTCContext);
  const [isTelnyxClientReady, setIsTelnyxClientReady] = useState();
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
  const [invitedEmail, setInvitedEmail] = useState(router.query.invitedEmail);
  const [remoteVideoStream, setRemoteVideoStream] = useState();

  useCallbacks({
    onReady: () => {
      setIsTelnyxClientReady(true);
    },
    onError: (err) => {
      console.error('VideoCall:', err);

      if (err.code === -32000) {
        // Generate and cache a new Telnyx token
        // TODO consolidate refresh token
        fetch('/api/rtc/credentials')
          .then((resp) => resp.text())
          .then((creds) => {
            setCachedCredentials(creds);

            // TODO reconnect client
          })
          .catch((err) => {
            console.error('VideoCall fetch /api/rtc/credentials', err);
          });
      }
    },
  });

  useEffect(() => {
    if (isTelnyxClientReady && cachedCredentials) {
      ws.send(
        JSON.stringify({
          status: 'webrtc_ready',
          user_email: session.user.email,
          sip_username: cachedCredentials.sip_username,
        })
      );
    }
  }, [isTelnyxClientReady, cachedCredentials]);

  useEffect(() => {
    if (invitedEmail) {
      ws.send(
        JSON.stringify({
          status: 'invited_email',
          user_email: session.user.email,
          invite_email: invitedEmail,
        })
      );
    }
  }, [ws, invitedEmail]);

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
  };

  return (
    <Box direction="row" gap="medium" align="center">
      <Box background="light-2" width="640px" height="400px">
        {isWebcamAvailable && (
          <Video
            ref={localVideoEl}
            controls={false}
            fit="cover"
            autoPlay
            mute
          />
        )}
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

            <EmailSignIn
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
