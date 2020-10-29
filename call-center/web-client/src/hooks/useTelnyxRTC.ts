import { useState, useRef, useEffect } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';

import IPartialWebRTCCall from '../interfaces/IPartialWebRTCCall';
import { updateAgent } from '../services/agentsService';

function useTelnyxRTC(
  agentId: string,
  token: string,
  clearDialingDestination: any
) {
  // Check if component is mounted before updating state
  // in the Telnyx WebRTC client callbacks
  let isMountedRef = useRef<boolean>(false);

  // Save the Telnyx WebRTC client as a ref as to persist
  // the client object through component updates
  let telnyxClientRef = useRef<any>();
  let [webRTCClientState, setWebRTCClientState] = useState<string>('');
  let [webRTCall, setWebRTCCall] = useState<IPartialWebRTCCall | null>();

  const updateWebRTCState = (state: string) => {
    if (isMountedRef.current) {
      setWebRTCClientState(state);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const telnyxClient = new TelnyxRTC({
      login_token: token,
    });

    telnyxClient.on('telnyx.ready', () => {
      console.log('ready');

      updateWebRTCState('ready');

      updateAgent(agentId, { available: true });
    });

    telnyxClient.on('telnyx.error', (error: any) => {
      console.error('error:', error);

      updateWebRTCState('error');

      updateAgent(agentId, { available: false });
    });

    telnyxClient.on('telnyx.socket.close', () => {
      console.log('close');

      telnyxClient.disconnect();

      updateWebRTCState('disconnected');

      updateAgent(agentId, { available: false });
    });

    telnyxClient.on('telnyx.notification', (notification: any) => {
      console.log('notification:', notification);

      if (notification.call) {
        const {
          state,
          direction,
          options,
          answer,
          hangup,
          muteAudio,
          unmuteAudio,
          remoteStream,
        } = notification.call;

        console.log('state:', state);

        if (state === 'hangup' || state === 'destroy') {
          setWebRTCCall(null);

          updateAgent(agentId, { available: true });
        } else {
          if (state === 'answering') {
            updateAgent(agentId, { available: false });
          } else if (state === 'active') {
            // call this funtion setDialingDestination
            clearDialingDestination(null);
          }

          setWebRTCCall({
            state,
            direction,
            options,
            remoteStream,
            answer: answer.bind(notification.call),
            hangup: hangup.bind(notification.call),
            muteAudio: muteAudio.bind(notification.call),
            unmuteAudio: unmuteAudio.bind(notification.call),
          });
        }
      }
    });

    telnyxClientRef.current = telnyxClient;
    telnyxClientRef.current.connect();

    return () => {
      isMountedRef.current = false;

      telnyxClientRef.current?.disconnect();
      telnyxClientRef.current = undefined;
    };
  }, [token, agentId]);
  return { telnyxClientRef, webRTCall, webRTCClientState };
}

export default useTelnyxRTC;
