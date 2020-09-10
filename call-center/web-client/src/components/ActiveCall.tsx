import React, { useEffect, useRef, useState } from 'react';
import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';

interface IActiveCall {
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
}

function ActiveCall({ callState }: IActiveCall) {
  console.log('callState:', callState);

  return (
    <section>
      <div className="App-section">
        <div>Incoming call</div>
        <div className="App-callState-phoneNumber">+13125551111</div>
        <div className="App-callState-actions">
          <button type="button" className="App-button App-button--primary">
            Answer
          </button>
          <button type="button" className="App-button App-button--danger">
            Hangup
          </button>
        </div>
      </div>

      <div className="App-section">
        <div>Call in progress</div>
        <div className="App-callState-phoneNumber">+13125551111</div>
        <div className="App-callState-actions">
          <button type="button" className="App-button App-button--danger">
            Hangup
          </button>
          <button type="button" className="App-button App-button--tertiary">
            Mute
          </button>
        </div>
      </div>

      <div className="App-section">
        <div>Conference call in progress</div>
        <div className="App-callState-phoneNumber">+13125551111</div>
        <div>
          <div className="App-heading App-callState-agentsList-heading">
            Agents on call
          </div>
          <ul className="App-callState-agentList">
            <li className="App-callState-agentList-item">Agent Name</li>
            <li className="App-callState-agentList-item">Agent Name</li>
          </ul>
        </div>
        <div className="App-callState-actions">
          <button type="button" className="App-button App-button--danger">
            Hangup
          </button>
          <button type="button" className="App-button App-button--tertiary">
            Mute
          </button>
        </div>
      </div>
    </section>
  );
}
export default ActiveCall;
