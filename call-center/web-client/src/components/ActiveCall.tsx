import React, { useEffect, useRef, useState, useMemo } from 'react';
// import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';
import { invite, transfer } from '../services/callsService';
import IAgent from '../interfaces/IAgent';
import Agents from './Agents';
import './ActiveCall.css';
import useAgents from '../hooks/useAgents';
import useInterval from '../hooks/useInterval';
import {
  hangup as appHangup,
  mute as appMute,
  unmute as appUnmute,
} from '../services/callsService';
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
}

interface IActiveCallConference {
  sipUsername: string;
  isIncoming: boolean;
  callDestination: string;
  callerId: string;
  agents?: IAgent[];
}

interface IConferenceParticipant {
  displayName?: string;
  participant: string;
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
}: IActiveCallConference) {
  let { agents } = useAgents(sipUsername);
  let {
    loading: conferenceLoading,
    error: conferenceError,
    conference,
  } = useActiveConference(sipUsername);
  let [participant, setParticipant] = useState('');

  const handleChangeDestination = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setParticipant(event.target.value);
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
    appHangup({ participant });
  };

  const muteCall = (participant: string) => appHangup({ participant });

  const confirmRemove = (participant: string) => {
    let result = window.confirm(
      `Are you sure you want to remove ${participant} from this call?`
    );

    if (result) {
      removeFromCall(participant);
    }
  };

  const handleAddDestination = (e: any) => {
    e.preventDefault();

    addToCall(participant);
  };

  let conferenceParticipants: IConferenceParticipant[] = useMemo(() => {
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
            participant,
          };
        });

      return otherParticipants;
    } else if (isIncoming) {
      return [
        {
          participant: callerId,
        },
      ];
    }

    return [
      {
        participant: callDestination,
      },
    ];
  }, [conference, sipUsername]);

  useEffect(() => {
    if (
      participant &&
      conferenceParticipants
        .map(({ participant }) => participant)
        .includes(participant)
    ) {
      setParticipant('');
    }
  }, [conferenceParticipants]);

  return (
    <div className="ActiveCall-conference">
      <div>
        {conferenceParticipants.map(({ displayName, participant }, index) => (
          <div className="ActiveCall-participant-row">
            <div className="ActiveCall-participant">
              {index !== 0 ? (
                <span className="ActiveCall-ampersand">&</span>
              ) : null}
              <span className="ActiveCall-participant-name">
                {displayName || participant}
              </span>
            </div>
            {index !== 0 && (
              <div>
                <button
                  type="button"
                  className="App-button App-button--small App-button--danger"
                  onClick={() => muteCall(participant)}
                >
                  Mute
                </button>

                <button
                  type="button"
                  className="App-button App-button--small App-button--danger"
                  onClick={() => confirmRemove(participant)}
                >
                  Remove
                </button>
              </div>
            )}
            <span className="ActiveCall-participant-name">{participant}</span>
          </div>
        ))}
      </div>

      <div>
        <div>Invite to conference</div>
        <Agents
          agents={agents}
          addToCall={addToCall}
          transferCall={transferCall}
        />

        <div className="App-form-row">
          <input
            id="destination_input"
            className="App-input"
            name="destination"
            type="text"
            value={participant}
            placeholder="Phone number or SIP URI"
            required
            onChange={handleChangeDestination}
          />
          <button
            type="submit"
            className="App-button App-button--small App-button--primary"
            onClick={handleAddDestination}
          >
            Invite
          </button>
        </div>
      </div>
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
    </section>
  );
}
export default ActiveCall;
