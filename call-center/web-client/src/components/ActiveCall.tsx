import React, { useEffect, useState } from 'react';
import './ActiveCall.css';
import useInterval from '../hooks/useInterval';
import {
  mute as appMute,
  unmute as appUnmute,
  getCall as appGetCall,
} from '../services/callsService';
import ActiveCallConference from './ActiveCallConference';
import MuteUnmuteButton from './MuteUnMuteButton';

import { ICallLeg, CallLegClientCallState } from '../interfaces/ICallLeg';
import IActiveCall from '../interfaces/IActiveCall';

function getCall(telnyxCallControlId: string) {
  return appGetCall({
    telnyxCallControlId: telnyxCallControlId,
    limit: 1,
  }).then((res) => res.data?.calls?.[0]);
}

function useAppCall(telnyxCallControlId: string) {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [call, setCall] = useState<ICallLeg | undefined>();

  function loadCall() {
    setLoading(true);

    return getCall(telnyxCallControlId)
      .then((appCall) => {
        if (appCall) {
          setCall(appCall);
        } else {
          throw new Error('Call by Telnyx Call Control ID not found in DB');
        }
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }

  // Poll for Call state every second
  useInterval(loadCall, 1000);

  return { loading, error, call };
}

function ActiveCall({
  telnyxCallControlId,
  sipUsername,
  callDestination,
  callerId,
  callState,
  isDialing,
  answer,
  hangup,
}: IActiveCall) {
  const { call } = useAppCall(telnyxCallControlId);

  const handleAnswerClick = () => answer();
  const handleRejectClick = () => hangup();
  const handleHangupClick = () => hangup();

  const muteSelf = () => {
    appMute({ telnyxCallControlId });
  };

  const unmuteSelf = () => {
    appUnmute({ telnyxCallControlId });
  };

  // Run effects on state change
  useEffect(() => {
    // Get server app call state
    getCall(telnyxCallControlId).then((appCall) => {
      if (callState === 'new') {
        // Check if call should be answered automatically, such as in
        // the case when the agent has initiated an outgoing call:
        // when an agent dials a number, the call is routed through
        // the call center app, a conference is created, and both the
        // agent and external number is invited to the conference.
        if (appCall?.clientCallState === CallLegClientCallState.AUTO_ANSWER) {
          answer();
        }
      }
    });
  }, [callState]);

  const isRinging = callState === 'ringing';
  const isActive = callState === 'active';

  return (
    <section>
      {!isDialing && isRinging && (
        <div className="App-section">
          <div>Incoming call</div>
          <div className="ActiveCall-callerId">{callerId}</div>
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--small App-button--primary"
              onClick={handleAnswerClick}
            >
              Answer
            </button>

            {/* TODO UX imprv: agents should transfer instead of reject */}
            <button
              type="button"
              className="App-button App-button--small App-button--danger"
              onClick={handleRejectClick}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {isDialing && !isActive && (
        <div className="App-section">
          <div>Calling...</div>
          <div className="ActiveCall-callerId">{callDestination}</div>
        </div>
      )}
      {!isDialing && isActive && (
        <div className="App-section">
          <div>Call in progress</div>
          <ActiveCallConference
            telnyxCallControlId={telnyxCallControlId}
            sipUsername={sipUsername}
            callerId={callerId}
          />
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--small App-button--danger"
              onClick={handleHangupClick}
            >
              Hangup
            </button>

            {call && (
              <MuteUnmuteButton
                isMuted={call.muted}
                mute={muteSelf}
                unmute={unmuteSelf}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
export default ActiveCall;
