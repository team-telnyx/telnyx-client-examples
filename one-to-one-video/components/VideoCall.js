import { useContext, useState, useRef, useEffect } from 'react';
import { TelnyxRTCContext } from '@telnyx/react-client';
import { Box, Button, Paragraph, Form, TextInput, Video } from 'grommet';
import { Mail, Send, Video as VideoIcon } from 'grommet-icons';
import { getCsrfToken } from 'next-auth/client';

const _encodedForm = (formData) => {
  return Object.keys(formData)
    .map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
    })
    .join('&');
};

export default function VideoCall() {
  const telnyxClient = useContext(TelnyxRTCContext);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
  const [sentInvite, setSentInvite] = useState();
  const [remoteVideoStream, setRemoteVideoStream] = useState();

  // const notification = useNotification();

  // console.log('notification:', notification);

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

  const sendInvite = async ({ value }) => {
    // Send magic sign up/in link to specified email.
    // nextj-auth `signIn` doesn't allow for doing this async.
    // (https://github.com/nextauthjs/next-auth/issues/922)
    // The following is based on the `signIn` source code
    // https://github.com/nextauthjs/next-auth/blob/canary/src/client/index.js#L237
    // signIn('email', { email: value.invite_email });
    const fetchOptions = {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: _encodedForm({
        email: value.invite_email,
        authorizationParams: {},
        csrfToken: await getCsrfToken(),
        callbackUrl: '',
        json: true,
      }),
    };

    const res = await fetch(`/api/auth/signin/email`, fetchOptions);
    const data = await res.json();

    setSentInvite(true);
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
        {sentInvite && remoteVideoStream && (
          <Video
            ref={remoteVideoEl}
            controls={false}
            fit="cover"
            autoPlay
            mute
          />
        )}

        {sentInvite && !remoteVideoStream && (
          <Box fill align="center" justify="center">
            <Paragraph>Waiting for invited to join...</Paragraph>
          </Box>
        )}

        {!sentInvite && (
          <Box fill align="center" justify="center">
            {isWebcamOn && (
              <Paragraph>
                You look great! Now, invite someone to video chat
              </Paragraph>
            )}

            <Form onSubmit={sendInvite}>
              <Box gap="small" align="center" width="medium">
                <TextInput
                  type="email"
                  name="invite_email"
                  icon={<Mail />}
                  placeholder="Enter email to invite"
                  required
                />
                <Button
                  type="submit"
                  primary
                  icon={<Send />}
                  size="large"
                  label="Send invitation"
                />
              </Box>
            </Form>
          </Box>
        )}
      </Box>
    </Box>
  );
}
