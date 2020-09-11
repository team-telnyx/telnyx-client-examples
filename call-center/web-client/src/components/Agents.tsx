import React, { useEffect, useState } from 'react';
import { getLoggedInAgents } from '../services/agentsService';
import IAgent from '../interfaces/IAgent';

function Agents() {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [agents, setAgents] = useState<IAgent[] | undefined>();

  useEffect(() => {
    setLoading(true);
    getLoggedInAgents()
      .then((res) => {
        setAgents(res.data);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading &&
      <span>Loading...</span>
      }
      {error &&
        <span>Error: {error}</span>
      }
      {agents && agents.length > 0 && (
        <ul className="App-agentList">
          {agents.map((agent) => (
            <li key={agent.id} className="App-agentList-item">
              <div>{agent.name}</div>
            </li>
          ))}
        </ul>
      )}
      {agents && agents.length === 0 && <span>No available agents</span>}
    </div>
  );
}

export default Agents;
