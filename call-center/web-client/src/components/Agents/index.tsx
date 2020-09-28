import React, { useEffect, useState } from 'react';
import IAgent from '../../interfaces/IAgent';
import './styles.css';

interface IAgents {
  agents?: IAgent[];
  addAgent?: Function;
  transferToAgent?: Function;
}

export default function Agents({ agents, addAgent, transferToAgent }: IAgents) {
  return (
    <div className="Agents">
      {agents && agents.length > 0 && (
        <ul className="Agents-list">
          {agents.map((agent) => (
            <li key={agent.id} className="Agents-list-item">
              <div>{agent.name}</div>

              {(addAgent || transferToAgent) && (
                <div className="Agents-list-actions">
                  {addAgent && agent.available && (
                    <button
                      type="button"
                      className="App-button App-button--small App-button--primary"
                      onClick={() => addAgent(agent)}
                    >
                      Add
                    </button>
                  )}

                  {transferToAgent && agent.available && (
                    <button
                      type="button"
                      className="App-button App-button--small App-button--secondary"
                      onClick={() => transferToAgent(agent)}
                    >
                      Transfer
                    </button>
                  )}

                  {(addAgent || transferToAgent) && !agent.available && (
                    <div className="Agents-list-label Agents-list-label--busy">
                      Busy
                    </div>
                  )}
                </div>
              )}

              {!addAgent && !transferToAgent && (
                <div className="Agents-list-actions">
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
