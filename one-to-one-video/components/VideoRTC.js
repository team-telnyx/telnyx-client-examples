import React, { useMemo, useState, Fragment } from 'react';
import { TelnyxRTCProvider } from '@telnyx/react-client';
import useWebSocket from '../utils/useWebSocket';
import VideoCall from './VideoCall';

/**
 * Enable Telnyx video client
 */
export default function VideoRTC({ userEmail, credentials }) {
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
        destination_user_email: invitedEmail,
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
            userEmail={userEmail}
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
