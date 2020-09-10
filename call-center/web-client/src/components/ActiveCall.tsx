import React, { useEffect, useRef, useState } from 'react';
// import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';
import './ActiveCall.css';

interface IActiveCall {
  callerID: string;
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
}

function ActiveCall({ callerID, callState }: IActiveCall) {
  console.log('callState:', callState);

  return (
    <section>
      {callState === 'ringing' && (
        <div className="App-section">
          <div>Incoming call</div>
          <div className="ActiveCall-callerId">{callerID}</div>
          <div className="ActiveCall-actions">
            <button type="button" className="App-button App-button--primary">
              Answer
            </button>
            <button type="button" className="App-button App-button--danger">
              Hangup
            </button>
          </div>
        </div>
      )}

      {/* TODO Call in progress */}
      {/* <div className="App-section">
        <div>Call in progress</div>
        <div className="ActiveCall-callerId">+13125551111</div>
        <div className="ActiveCall-actions">
          <button type="button" className="App-button App-button--danger">
            Hangup
          </button>
          <button type="button" className="App-button App-button--tertiary">
            Mute
          </button>
        </div>
      </div> */}

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
