import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';
import { updateAgent } from '../../services/agentsService';
import * as callsService from '../../services/callsService';
import useAgents from '../../hooks/useAgents';
import ActiveCall from '../ActiveCall';
import Agents from '../Agents';
import Dialer from '../Dialer';
import LoadingIcon from '../LoadingIcon';

interface ICommon {
  agentId: string;
  agentSipUsername: string;
  agentName: string;
  // User's WebRTC JWT
  token: string;
}

interface IPartialWebRTCCall {
  state: string;
  direction: 'inbound' | 'outbound';
  options: {
    remoteCallerName: string;
    remoteCallerNumber: string;
    destinationNumber: string;
    telnyxCallControlId: string;
  };
  answer: Function;
  hangup: Function;
  remoteStream?: MediaStream;
  muteAudio: Function;
  unmuteAudio: Function;
}

function Common({ agentId, agentSipUsername, agentName, token }: ICommon) {
  // Save the Telnyx WebRTC client as a ref as to persist
  // the client object through component updates
  let telnyxClientRef = useRef<TelnyxRTC>();
  let audioRef = useRef<HTMLAudioElement>(null);
  // Check if component is mounted before updating state
  // in the Telnyx WebRTC client callbacks
  let isMountedRef = useRef<boolean>(false);
  let [dialingDestination, setDialingDestination] = useState<string | null>();
  let [webRTCClientState, setWebRTCClientState] = useState<string>('');
  let [webRTCall, setWebRTCCall] = useState<IPartialWebRTCCall | null>();
  let agentsState = useAgents(agentSipUsername);

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
            setDialingDestination(null);
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

  const dial = useCallback(
    (destination) => {
      let dialParams = {
        initiatorSipUsername: agentSipUsername,
        to: destination,
      };

      setDialingDestination(destination);

      callsService.dial(dialParams);
    },
    [telnyxClientRef.current]
  );

  // Set up remote stream to hear audio from incoming calls
  if (audioRef.current && webRTCall && webRTCall.remoteStream) {
    audioRef.current.srcObject = webRTCall.remoteStream;
  }

  return (
    <div>
      <section
        className="App-section App-marginTop--small"
        style={{ textAlign: 'center' }}
      >
        WebRTC status: {webRTCClientState}
      </section>

      <audio
        ref={audioRef}
        autoPlay
        controls={false}
        aria-label="Active call"
      />

      {webRTCall && (
        <ActiveCall
          telnyxCallControlId={webRTCall.options.telnyxCallControlId}
          sipUsername={agentSipUsername}
          callDirection={webRTCall.direction}
          callDestination={
            dialingDestination || webRTCall.options.destinationNumber
          }
          isDialing={Boolean(dialingDestination)}
          callerId={
            webRTCall.options.remoteCallerName ||
            webRTCall.options.remoteCallerNumber
          }
          callState={webRTCall.state}
          answer={webRTCall.answer}
          hangup={webRTCall.hangup}
        />
      )}

      {!webRTCall && (
        <div>
          <section className="App-section">
            <Dialer dial={dial} />
          </section>

          <section className="App-section App-marginTop--big">
            <h2 className="App-headline">
              Other available agents {agentsState.loading && <LoadingIcon />}
            </h2>

            {agentsState.error && (
              <p className="App-error">Error: {agentsState.error}</p>
            )}

            <Agents agents={agentsState.agents} />
          </section>
        </div>
      )}
    </div>
  );
}
export default Common;
