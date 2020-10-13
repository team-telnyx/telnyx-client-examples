import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';
import { IWebRTCCall } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/interfaces';
import { updateAgent, getLoggedInAgents } from '../../services/agentsService';
import * as callsService from '../../services/callsService';
import IAgent from '../../interfaces/IAgent';
import useAgents from '../../hooks/useAgents';
import ActiveCall from '../ActiveCall';
import Agents from '../Agents';
import Dialer from '../Dialer';
import LoadingIcon from '../LoadingIcon';
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

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
          if (state === 'new') {
            if (
              options.callerNumber === agentSipUsername &&
              options.destinationNumber === agentSipUsername
            ) {
              // Answer calls that had been initiated by the agent immediately
              answer.bind(notification.call)();
            }
          } else if (state === 'answering') {
            updateAgent(agentId, { available: false });
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
      callsService.dial({
        initiatorSipUsername: agentSipUsername,
        to: destination,
      });
    },
    [telnyxClientRef.current]
  );

  // Set up remote stream to hear audio from incoming calls
  if (audioRef.current && webRTCall && webRTCall.remoteStream) {
    audioRef.current.srcObject = webRTCall.remoteStream;
  }

  return (
    <div>
      <section className="App-section">
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
          sipUsername={agentSipUsername}
          callDirection={webRTCall.direction}
          callDestination={webRTCall.options.destinationNumber}
          callerId={
            webRTCall.options.remoteCallerName ||
            webRTCall.options.remoteCallerNumber
          }
          callState={webRTCall.state}
          answer={webRTCall.answer}
          hangup={webRTCall.hangup}
          muteAudio={webRTCall.muteAudio}
          unmuteAudio={webRTCall.unmuteAudio}
        />
      )}

      {!webRTCall && (
        <div>
          <section className="App-section">
            <Dialer dial={dial} />
          </section>

          <section className="App-section">
            <h2 className="App-headline">
              Other agents {agentsState.loading && <LoadingIcon />}
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
