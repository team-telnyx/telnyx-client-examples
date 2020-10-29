import React, { useEffect, useRef, useState, useCallback } from 'react';

import * as callsService from '../../services/callsService';
import useAgents from '../../hooks/useAgents';
import ActiveCall from '../ActiveCall';
import Agents from '../Agents';
import Dialer from '../Dialer';
import LoadingIcon from '../LoadingIcon';
import ICommon from '../../interfaces/ICommon';
import useTelnyxRTC from '../../hooks/useTelnyxRTC';


function Common({ agentId, agentSipUsername, token }: ICommon) {
  
  let audioRef = useRef<HTMLAudioElement>(null);
 
  let [dialingDestination, setDialingDestination] = useState<string | null>();

  let {telnyxClientRef, webRTCall, webRTCClientState} = useTelnyxRTC(agentId, token, setDialingDestination);
  
  let agentsState = useAgents(agentSipUsername);

  console.log('telnyxClientRef',telnyxClientRef)
  console.log('webRTCall',webRTCall)
  console.log('webRTCClientState',webRTCClientState)



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
