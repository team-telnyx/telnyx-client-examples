import { useContext, useState, useRef, useEffect } from 'react';
import { TelnyxRTCContext } from '@telnyx/react-client';
import { Box, Button, Paragraph, Form, TextInput, Video } from 'grommet';
import { Mail, Send, Video as VideoIcon } from 'grommet-icons';

export default function VideoCall() {
  const telnyxClient = useContext(TelnyxRTCContext);
  const localVideoEl = useRef(null);
  const remoteVideoEl = useRef(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState();
  const [isWebcamOn, setIsWebcamOn] = useState();
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
        {remoteVideoStream && (
          <Video
            ref={remoteVideoEl}
            controls={false}
            fit="cover"
            autoPlay
            mute
          />
        )}
        {!remoteVideoStream && (
          <Box fill align="center" justify="center">
            {isWebcamOn && (
              <Paragraph>
                You look great! Now, invite someone to video chat
              </Paragraph>
            )}

            <Form onSubmit={console.log}>
              <Box gap="small" align="center" width="medium">
                <TextInput
                  type="email"
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
