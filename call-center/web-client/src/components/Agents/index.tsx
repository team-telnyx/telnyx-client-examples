import React, { useEffect, useState } from 'react';
import './styles.css';
import { getLoggedInAgents } from '../../services/agentsService';
import IAgent from '../../interfaces/IAgent';
import LoadingIcon from '../LoadingIcon';
import useInterval from '../../hooks/useInterval';

interface IAgents {
  sipUsername: string;
  addAgent?: Function;
}

export default function Agents({ sipUsername, addAgent }: IAgents) {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [agents, setAgents] = useState<IAgent[] | undefined>();

  function loadLoggedInAgents() {
    setLoading(true);

    return getLoggedInAgents()
      .then((res) => {
        let otherAgents = res.data.agents.filter(
          (agent) => agent.sipUsername !== sipUsername
        );

        setAgents(otherAgents);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }

  useInterval(loadLoggedInAgents, 5000);

  return (
    <div className="Agents">
      <h2 className="Agents-heading">
        Other agents {loading && <LoadingIcon />}
      </h2>

      {error && <p className="Agents-error">Error: {error}</p>}
      {agents && agents.length > 0 && (
        <ul className="Agents-list">
          {agents.map((agent) => (
            <li key={agent.id} className="Agents-list-item">
              <div>{agent.name}</div>

              {addAgent && (
                <div>
                  {agent.available ? (
                    <div>
                      <button
                        type="button"
                        className="App-button App-button--secondary"
                        onClick={() => addAgent(agent)}
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <div className="Agents-list-label Agents-list-label--available">
                      busy
                    </div>
                  )}
                </div>
              )}

              {!addAgent && (
                <div>
                  <div
                    className={`Agents-list-label Agents-list-label--${
                      agent.available ? 'available' : 'busy'
                    }`}
                  >
                    {agent.available ? 'Available' : 'Busy'}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {agents && agents.length === 0 && (
        <span>There are no other agents available right now</span>
      )}
    </div>
  );
}
