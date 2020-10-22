import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  getCall as appGetCall,
} from '../services/callsService';
import { getConference } from '../services/conferencesService';
import IConference from '../interfaces/IConference';
import {
  ICallLeg,
  CallLegDirection,
  CallLegStatus,
  CallLegClientCallState,
} from '../interfaces/ICallLeg';

interface IActiveCall {
  telnyxCallControlId: string;
  sipUsername: string;
  callDirection: string;
  callDestination: string;
  callerId: string;
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
  isDialing: boolean;
  answer: Function;
  hangup: Function;
}

interface IActiveCallConference {
  telnyxCallControlId: string;
  sipUsername: string;
  isDialing: boolean;
  callDestination: string;
  callerId: string;
  agents?: IAgent[];
}

interface IConferenceParticipant {
  displayName: string;
  muted?: boolean;
  participantTelnyxCallControlId: string;
  participant: string;
}

interface IMuteUnmuteButton {
  isMuted?: boolean;
  mute: () => void;
  unmute: () => void;
}

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

function useActiveConference(telnyxCallControlId: string) {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [conference, setConference] = useState<IConference | undefined>();

  function loadConference() {
    setLoading(true);

    return getConference(telnyxCallControlId)
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

function MuteUnmuteButton({ isMuted, mute, unmute }: IMuteUnmuteButton) {
  return (
    <button
      type="button"
      className="App-button App-button--small App-button--tertiary"
      onClick={isMuted ? unmute : mute}
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
  );
}

function ActiveCallConference({
  telnyxCallControlId,
  sipUsername,
  callDestination,
  isDialing,
  callerId,
}: IActiveCallConference) {
  let { agents } = useAgents(sipUsername);
  let {
    loading: conferenceLoading,
    error: conferenceError,
    conference,
  } = useActiveConference(telnyxCallControlId);
  let [newParticipant, setNewParticipant] = useState('');

  const handleChangeDestination = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewParticipant(event.target.value);
  };

  const addToCall = (destination: string) =>
    invite({
      telnyxCallControlId,
      to: destination,
    });

  const transferCall = (destination: string) =>
    transfer({
      telnyxCallControlId,
      to: destination,
    });

  const removeParticipant = (participantTelnyxCallControlId: string) => {
    appHangup({ telnyxCallControlId: participantTelnyxCallControlId });
  };

  const muteParticipant = (participantTelnyxCallControlId: string) => {
    appMute({ telnyxCallControlId: participantTelnyxCallControlId });
  };
  const unmuteParticipant = (participantTelnyxCallControlId: string) => {
    appUnmute({ telnyxCallControlId: participantTelnyxCallControlId });
  };

  const confirmRemove = (
    participantTelnyxCallControlId: string,
    displayName: string
  ) => {
    let result = window.confirm(
      `Are you sure you want to remove ${displayName} from this call?`
    );

    if (result) {
      removeParticipant(participantTelnyxCallControlId);
    }
  };

  const handleAddDestination = (e: any) => {
    e.preventDefault();

    addToCall(newParticipant);
  };

  let conferenceParticipants: IConferenceParticipant[] = useMemo(() => {
    if (conference?.callLegs?.length) {
      let otherParticipants = conference.callLegs
        .filter((callLeg) => callLeg.status === CallLegStatus.ACTIVE)
        .map((callLeg) => ({
          ...callLeg,
          participant:
            callLeg.direction === CallLegDirection.INCOMING
              ? callLeg.from
              : callLeg.to,
        }))
        .filter(
          ({ participant }) =>
            participant !== `sip:${sipUsername}@sip.telnyx.com`
        )
        .map(({ muted, participant, telnyxCallControlId }) => {
          let conferenceParticipant = {
            displayName: participant,
            muted,
            participant,
            participantTelnyxCallControlId: telnyxCallControlId,
          } as IConferenceParticipant;

          let agent = agents?.find((agent) =>
            participant.includes(agent.sipUsername)
          );

          if (agent) {
            conferenceParticipant.displayName = agent.name || agent.sipUsername;
            conferenceParticipant.participant = `sip:${agent.sipUsername}@sip.telnyx.com`;
          }

          return conferenceParticipant;
        });

      return otherParticipants;
    } else if (isDialing) {
      return [
        {
          displayName: callDestination,
          participantTelnyxCallControlId: telnyxCallControlId,
          participant: callDestination,
        },
      ];
    }

    return [];
  }, [conference, isDialing, telnyxCallControlId, callDestination]);

  useEffect(() => {
    if (
      newParticipant &&
      conferenceParticipants
        .map(({ participant }) => participant)
        .includes(newParticipant)
    ) {
      setNewParticipant('');
    }
  }, [conferenceParticipants]);

  return (
    <div className="ActiveCall-conference">
      <div>
        {conferenceParticipants.map(
          ({ muted, displayName, participantTelnyxCallControlId }, index) => (
            <div
              className="ActiveCall-participant-row"
              key={participantTelnyxCallControlId}
            >
              <div className="ActiveCall-participant">
                {index !== 0 ? (
                  <span className="ActiveCall-ampersand">&</span>
                ) : null}
                <span className="ActiveCall-participant-name">
                  {displayName}
                </span>
              </div>
              <div className="ActiveCall-actions">
                <MuteUnmuteButton
                  isMuted={muted}
                  mute={() => muteParticipant(participantTelnyxCallControlId)}
                  unmute={() =>
                    unmuteParticipant(participantTelnyxCallControlId)
                  }
                />

                <button
                  type="button"
                  className="App-button App-button--small App-button--danger"
                  onClick={() =>
                    confirmRemove(participantTelnyxCallControlId, displayName)
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          )
        )}
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
            value={newParticipant}
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
  telnyxCallControlId,
  sipUsername,
  callDirection,
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
        if (appCall.clientCallState === CallLegClientCallState.AUTO_ANSWER) {
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
      {(isDialing || isActive) && (
        <div className="App-section">
          <div>Call in progress</div>
          <ActiveCallConference
            telnyxCallControlId={telnyxCallControlId}
            sipUsername={sipUsername}
            isDialing={isDialing}
            callDestination={callDestination}
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
