import React, { useEffect, useRef, useState, useMemo } from 'react';
// import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';
import { invite, transfer } from '../services/callsService';
import IAgent from '../interfaces/IAgent';
import Agents from './Agents';
import './ActiveCall.css';
import useInterval from '../hooks/useInterval';
import { getConference } from '../services/conferencesService';
import IConference from '../interfaces/IConference';
import { CallLegDirection, CallLegStatus } from '../interfaces/ICallLeg';

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

interface IActiveCallConference {
  sipUsername: string;
  isIncoming: boolean;
  callDestination: string;
  callerId: string;
  agents?: IAgent[];
  removeFromCall: Function;
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

function ActiveCallConference({
  sipUsername,
  callDestination,
  isIncoming,
  callerId,
  agents,
  removeFromCall,
}: IActiveCallConference) {
  let {
    loading: conferenceLoading,
    error: conferenceError,
    conference,
  } = useActiveConference(sipUsername);

  let conferenceParticipants = useMemo(() => {
    if (conference) {
      let otherParticipants = conference.callLegs
        .filter((callLeg) => callLeg.status === CallLegStatus.ACTIVE)
        .map((callLeg) =>
          callLeg.direction === CallLegDirection.INCOMING
            ? callLeg.from
            : callLeg.to
        )
        .filter(
          (participant) => participant !== `sip:${sipUsername}@sip.telnyx.com`
        )
        .map((participant) => {
          let agent = agents?.find((agent) =>
            participant.includes(agent.sipUsername)
          );

          if (agent) {
            return {
              displayName: agent.name || agent.sipUsername,
              participant: `sip:${agent.sipUsername}@sip.telnyx.com`,
            };
          }

          return {
            displayName: participant,
            participant,
          };
        });

      return otherParticipants;
    } else if (isIncoming) {
      return [callerId];
    } else {
      return [callDestination];
    }
  }, [conference, sipUsername]);

  const confirmRemove = (participant: string) => {
    let result = window.confirm(
      `Are you sure you want to remove ${participant} from this call?`
    );

    if (result) {
      removeFromCall(participant);
    }
  };

  return (
    <div className="ActiveCall-conference">
      {(conferenceParticipants as {
        displayName: string;
        participant: string;
      }[]).map(({ displayName, participant }, index) => (
        <div className="ActiveCall-participant-row">
          <div className="ActiveCall-participant">
            {index !== 0 ? (
              <span className="ActiveCall-ampersand">&</span>
            ) : null}
            <span className="ActiveCall-participant-name">{displayName}</span>
          </div>
          <div>
            <button
              type="button"
              className="App-button App-button--small App-button--danger"
              onClick={() => confirmRemove(participant)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
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

  const removeFromCall = (participant: string) => {
    console.log('TODO remove:', participant);
  };

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
          <ActiveCallConference
            sipUsername={sipUsername}
            isIncoming={isIncoming}
            callDestination={callDestination}
            callerId={callerId}
            agents={agents}
            removeFromCall={removeFromCall}
          />
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
