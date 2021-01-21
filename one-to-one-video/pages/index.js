import { useEffect, useState, memo, Fragment } from 'react';
import { useSession } from 'next-auth/client';
import { TelnyxRTCProvider } from '@telnyx/react-client';
import { Box, Paragraph } from 'grommet';
import { Magic } from 'grommet-icons';
import useCachedToken from '../utils/useCachedToken';
import Layout from '../components/Layout';
import VideoCall from '../components/VideoCall';
import EmailSignIn from '../components/EmailSignIn';

// Memoize the `VideoCallWrapper` to prevent re-rendering
// `TelnyxRTCProvider` unless the token changes
// FIXME handle rerenders in webrtc package
const VideoCallWrapper = memo(({ token }) => {
  return (
    <TelnyxRTCProvider
      credential={{ login_token: token }}
      // TODO remove
      options={{ env: 'development' }}
    >
      <VideoCall />
    </TelnyxRTCProvider>
  );
});

export default function Home() {
  const [session, loading] = useSession();
  const [cachedToken, setCachedToken] = useCachedToken();
  const [signInEmail, setSignInEmail] = useState();
  const isSessionReady = Boolean(session);

  useEffect(() => {
    if (isSessionReady) {
      if (cachedToken === null) {
        // Generate and cache a new Telnyx token
        // TODO consolidate refresh token
        fetch('/api/generate_token', {
          method: 'POST',
        })
          .then((resp) => resp.text())
          .then((token) => {
            setCachedToken(token);
          })
          .catch(console.error);
      }
    }
  }, [isSessionReady, cachedToken]);

  return (
    <Layout title="Home">
      {isSessionReady && cachedToken && (
        <VideoCallWrapper token={cachedToken} />
      )}
      {!session && !loading && (
        <Box width="medium">
          {signInEmail && (
            <Fragment>
              <Paragraph
                size="xxlarge"
                color="brand"
                margin={{ bottom: '0px' }}
              >
                Sent. <Magic color="brand" size="32px" />
              </Paragraph>
              <Paragraph size="large">Check your inbox.</Paragraph>
            </Fragment>
          )}

          {!signInEmail && (
            <Paragraph size="xlarge">
              Sign-in with a magic link sent to your email.
            </Paragraph>
          )}

          <EmailSignIn
            submitLabel={signInEmail && 'Send again'}
            onSubmit={({ email }) => setSignInEmail(email)}
          />
        </Box>
      )}
    </Layout>
  );
}
