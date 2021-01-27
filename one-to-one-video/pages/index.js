import React, { useMemo, Fragment } from 'react';
import { useSession } from 'next-auth/client';
import { TelnyxRTCProvider } from '@telnyx/react-client';
import useCredentials from '../utils/useCredentials';
import useWebSocket from '../utils/useWebSocket';
import Layout from '../components/Layout';
import VideoCall from '../components/VideoCall';
import SignIn from '../components/SignIn';

function AuthenticatedContent({ userEmail, credentials }) {
  const { isReady, message, sendMessage } = useWebSocket();
  // Memoize TelnyxRTC credential to prevent re-instantiating client
  const telnyxRTCCredential = useMemo(() => {
    return {
      login_token: credentials.login_token,
    };
  }, [credentials.login_token]);

  const onTelnyxReady = () => {
    sendMessage(
      JSON.stringify({
        status: 'user_rtc_ready',
        user_email: userEmail,
        sip_username: credentials.sip_username,
      })
    );
  };

  return (
    <TelnyxRTCProvider
      credential={telnyxRTCCredential}
      // TODO remove dev
      options={{ env: 'development' }}
    >
      <Fragment>
        {isReady && (
          <VideoCall serverMessage={message} onTelnyxReady={onTelnyxReady} />
        )}
      </Fragment>
    </TelnyxRTCProvider>
  );
}

export default function Home() {
  const [session, loading] = useSession();
  const [credentials] = useCredentials();
  const isSessionReady = Boolean(session);

  return (
    <Layout title="Home">
      {isSessionReady && credentials && (
        <AuthenticatedContent
          userEmail={session.user.email}
          credentials={credentials}
        />
      )}
      {!isSessionReady && !loading && <SignIn />}
    </Layout>
  );
}
