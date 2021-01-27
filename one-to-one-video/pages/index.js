import React, { useMemo, useState, Fragment } from 'react';
import { useSession } from 'next-auth/client';
import { TelnyxRTCProvider } from '@telnyx/react-client';
import useCredentials from '../utils/useCredentials';
import useWebSocket from '../utils/useWebSocket';
import Layout from '../components/Layout';
import VideoCall from '../components/VideoCall';
import SignIn from '../components/SignIn';

function AuthenticatedContent({ userEmail, credentials }) {
  const { isReady, message, sendMessage } = useWebSocket();
  const [displayName, setDisplayName] = useState('anonymous');

  // Memoize TelnyxRTC credential to prevent re-instantiating client
  const telnyxRTCCredential = useMemo(() => {
    return {
      login_token: credentials.login_token,
    };
  }, [credentials.login_token]);

  const onTelnyxReady = () => {
    sendMessage(
      JSON.stringify({
        notify_clients: true,
        status: 'user_rtc_ready',
        user_email: userEmail,
        sip_username: credentials.sip_username,
      })
    );
  };

  const onDial = (invitedEmail) => {
    sendMessage(
      JSON.stringify({
        notify_clients: true,
        status: 'user_initiated_dial',
        user_email: userEmail,
        desitnation_user_email: invitedEmail,
      })
    );
  };

  const onDisplayNameChange = (value) => {
    setDisplayName(value);

    sendMessage(
      JSON.stringify({
        notify_clients: true,
        status: 'user_name_change',
        user_email: userEmail,
        display_name: value,
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
          <VideoCall
            displayName={displayName}
            serverMessage={message}
            onTelnyxReady={onTelnyxReady}
            onDial={onDial}
            onDisplayNameChange={onDisplayNameChange}
          />
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
