import React, { useEffect, useRef, useState } from 'react';
// import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';
import { invite, transfer } from '../services/callsService';
import IAgent from '../interfaces/IAgent';
import Agents from './Agents';
import './ActiveCall.css';
import useInterval from '../hooks/useInterval';
import { getConference } from '../services/conferencesService';
import IConference from '../interfaces/IConference';

interface IActiveCall {
  sipUsername: string;
  callDirection: string;
  callDestination: string;
  callerId: string;
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
  answer: Function;
  hangup: Function;
  muteAudio: Function;
  unmuteAudio: Function;
  agents?: IAgent[];
}

function useActiveConference(sipUsername: string) {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [conference, setConference] = useState<IConference | undefined>();

  function loadConference() {
    setLoading(true);

    return getConference(`sip:${sipUsername}@sip.telnyx.com`)
      .then((res) => {
        setConference(res.data.conference);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }

  // Poll for Conference state every second
  useInterval(loadConference, 1000);

  return { loading, error, conference };
}

function ActiveCall({
  sipUsername,
  callDirection,
  callDestination,
  callerId,
  callState,
  answer,
  hangup,
  muteAudio,
  unmuteAudio,
  agents,
}: IActiveCall) {
  console.log('callState:', callState);
  const [isMuted, setIsMuted] = useState(false);
  const {
    loading: conferenceLoading,
    error: conferenceError,
    conference,
  } = useActiveConference(sipUsername);
  const handleAnswerClick = () => answer();
  const handleRejectClick = () => hangup();
  const handleHangupClick = () => hangup();

  const handleMuteClick = () => {
    setIsMuted(true);
    muteAudio();
  };

  const handleUnmuteClick = () => {
    unmuteAudio();
    setIsMuted(false);
  };

  const addToCall = (destination: string) =>
    invite({
      inviterSipUsername: sipUsername,
      to: destination,
    });

  const transferCall = (destination: string) =>
    transfer({
      transfererSipUsername: sipUsername,
      to: destination,
    });

  const isIncoming = callDirection === 'inbound';
  const isRinging = callState === 'ringing';
  const isCalling =
    (!isIncoming && callState === 'new') ||
    callState === 'requesting' ||
    callState === 'trying' ||
    callState === 'early';
  const isActive = callState === 'active';

  return (
    <section>
      {isRinging && (
        <div className="App-section">
          <div>Incoming call</div>
          <div className="ActiveCall-callerId">{callerId}</div>
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--primary"
              onClick={handleAnswerClick}
            >
              Answer
            </button>

            {/* TODO UX imprv: agents should transfer instead of reject */}
            <button
              type="button"
              className="App-button App-button--danger"
              onClick={handleRejectClick}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {isCalling && (
        <div className="App-section">
          <div>Calling...</div>
          <div className="ActiveCall-callerId">{callDestination}</div>
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--danger"
              onClick={handleHangupClick}
            >
              Hangup
            </button>
          </div>
        </div>
      )}
      {isActive && (
        <div className="App-section">
          <div>Call in progress</div>
          <div className="ActiveCall-callerId">
            {isIncoming ? callerId : callDestination}
          </div>
          <pre className="ActiveCall-conference">
            Conference ID: {conference?.id}
            Loading: {conferenceLoading ? 'true' : 'false'}
            Error: {conferenceError ? conferenceError : ''}
          </pre>
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--danger"
              onClick={handleHangupClick}
            >
              Hangup
            </button>
            <button
              type="button"
              className="App-button App-button--tertiary"
              onClick={isMuted ? handleUnmuteClick : handleMuteClick}
            >
              {isMuted ? (
                <span role="img" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  🔇
                </span>
              ) : (
                <span role="img" aria-label={isMuted ? 'Unmute' : 'Mute'}>
                  🔈
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      <section className="App-section">
        <Agents
          agents={agents}
          addToCall={addToCall}
          transferCall={transferCall}
        />
      </section>
      {/* TODO Conference calls with multiple agents */}
      {/* <div className="App-section">
        <div>Conference call in progress</div>
        <div className="ActiveCall-callerId">+13125551111</div>
        <div>
          <div className="App-heading ActiveCall-agentsList-heading">
            Agents on call
          </div>
          <ul className="ActiveCall-agentList">
            <li className="ActiveCall-agentList-item">Agent Name</li>
            <li className="ActiveCall-agentList-item">Agent Name</li>
          </ul>
        </div>
        <div className="ActiveCall-actions">
          <button type="button" className="App-button App-button--danger">
            Hangup
          </button>
          <button type="button" className="App-button App-button--tertiary">
            Mute
          </button>
        </div>
      </div> */}
    </section>
  );
}
export default ActiveCall;
