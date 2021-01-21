import { useEffect, memo } from 'react';
import { useSession, signIn } from 'next-auth/client';
import { TelnyxRTCProvider } from '@telnyx/react-client';
import { Box, Button } from 'grommet';
import { Github } from 'grommet-icons';
import useCachedToken from '../utils/useCachedToken';
import Layout from '../components/Layout';
import VideoCall from '../components/VideoCall';

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
  const isSessionStarted = Boolean(session);

  useEffect(() => {
    if (session && cachedToken === null) {
      // Generate and cache a new Telnyx token
      // TODO Check expiry
      fetch('/api/generate_token', {
        method: 'POST',
      })
        .then((resp) => resp.text())
        .then((token) => {
          setCachedToken(token);
        })
        .catch(console.error);
    }
  }, [isSessionStarted]);

  return (
    <Layout title="Home">
      {session && cachedToken && <VideoCallWrapper token={cachedToken} />}
      {!session && !loading && (
        <Box width="medium">
          <Button
            primary
            size="large"
            icon={<Github />}
            label="Sign in with GitHub"
            onClick={() => signIn('github')}
          />
        </Box>
      )}
    </Layout>
  );
}
