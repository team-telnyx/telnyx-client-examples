import React, { useEffect, useState, useMemo, Fragment } from 'react';
import IActiveCallConference from '../interfaces/IActiveCallConference';
import IConferenceParticipant from '../interfaces/IConferenceParticipant';
import { CallLegDirection, CallLegStatus } from '../interfaces/ICallLeg';
import { getConference } from '../services/conferencesService';
import IConference from '../interfaces/IConference';
import { invite, transfer } from '../services/callsService';
import Agents from './Agents';
import useAgents from '../hooks/useAgents';
import useInterval from '../hooks/useInterval';
import {
  hangup as appHangup,
  mute as appMute,
  unmute as appUnmute,
} from '../services/callsService';
import MuteUnmuteButton from './MuteUnMuteButton';

function ActiveCallConference({
  telnyxCallControlId,
  sipUsername,
}: IActiveCallConference) {
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

  let { agents } = useAgents(sipUsername);
  let { conference } = useActiveConference(telnyxCallControlId);
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
        .map((callLeg) => ({
          ...callLeg,
          participant:
            callLeg.direction === CallLegDirection.INCOMING
              ? callLeg.from
              : callLeg.to,
        }))
        .filter(
          (callLeg) => telnyxCallControlId !== callLeg.telnyxCallControlId
        )
        .map(({ muted, participant, telnyxCallControlId, status }) => {
          let conferenceParticipant = {
            status,
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
            conferenceParticipant.participant = `sip:${agent.sipUsername}@${process.env.REACT_APP_SIP_DOMAIN}`;
          }

          return conferenceParticipant;
        });

      return otherParticipants;
    }

    return [];
  }, [conference, telnyxCallControlId]);

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
          (
            { status, muted, displayName, participantTelnyxCallControlId },
            index
          ) => (
            <div
              className="ActiveCall-participant-row"
              key={participantTelnyxCallControlId}
            >
              <div
                className={`ActiveCall-participant${
                  status === CallLegStatus.INACTIVE
                    ? ' ActiveCall-participant--inactive'
                    : ''
                }`}
              >
                {index !== 0 ? (
                  <span className="ActiveCall-ampersand">&</span>
                ) : null}
                <span className="ActiveCall-participant-name">
                  {displayName}
                </span>
              </div>
              <div className="ActiveCall-actions">
                {status === CallLegStatus.ACTIVE && (
                  <MuteUnmuteButton
                    isMuted={muted}
                    mute={() => muteParticipant(participantTelnyxCallControlId)}
                    unmute={() =>
                      unmuteParticipant(participantTelnyxCallControlId)
                    }
                  />
                )}

                {status !== CallLegStatus.INACTIVE && (
                  <button
                    type="button"
                    className="App-button App-button--small App-button--danger"
                    onClick={() =>
                      confirmRemove(participantTelnyxCallControlId, displayName)
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <Fragment>
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
      </Fragment>
    </div>
  );
}
export default ActiveCallConference;
