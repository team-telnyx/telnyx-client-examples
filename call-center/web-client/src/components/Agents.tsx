import React, { useEffect, useState } from 'react';
import './Agents.css';
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
        setAgents(res.data.agents);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="Agents">
      <h2 className="Agents-heading">Other available agents</h2>
      {loading && <div className="Agents-loading">Loading agents...</div>}
      {error && <div className="Agents-error">Error: {error}</div>}
      {agents && agents.length > 0 && (
        <ul className="Agents-list">
          {agents.map((agent) => (
            <li key={agent.id} className="Agents-list-item">
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
