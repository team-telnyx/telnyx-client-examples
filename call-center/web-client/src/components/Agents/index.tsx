import React, { useEffect, useState } from 'react';
import IAgent from '../../interfaces/IAgent';
import './styles.css';

interface IAgents {
  agents?: IAgent[];
  addToCall?: Function;
  transferCall?: Function;
}

export default function Agents({ agents, addToCall, transferCall }: IAgents) {
  function addAgent(agent: IAgent) {
    if (addToCall) {
      return addToCall(`sip:${agent.sipUsername}@sip.telnyx.com`);
    }
  }

  function transferToAgent(agent: IAgent) {
    if (transferCall) {
      return transferCall(`sip:${agent.sipUsername}@sip.telnyx.com`);
    }
  }

  return (
    <div className="Agents" style={{ marginTop: 26 }}>
      {agents && agents.length > 0 && (
        <ul className="Agents-list">
          {agents.map((agent) => (
            <li key={agent.id} className="Agents-list-item">
              <div>{agent.name}</div>

              {(addToCall || transferCall) && (
                <div className="Agents-list-actions">
                  {addToCall && agent.available && (
                    <button
                      type="button"
                      className="App-button App-button--small App-button--primary"
                      onClick={() => addAgent(agent)}
                    >
                      Add
                    </button>
                  )}

                  {transferCall && agent.available && (
                    <button
                      type="button"
                      className="App-button App-button--small App-button--secondary"
                      onClick={() => transferToAgent(agent)}
                    >
                      Transfer
                    </button>
                  )}

                  {(addToCall || transferCall) && !agent.available && (
                    <div className="Agents-list-label Agents-list-label--busy">
                      Busy
                    </div>
                  )}
                </div>
              )}

              {!addToCall && !transferCall && (
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
