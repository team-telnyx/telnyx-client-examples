import React, { useEffect, useRef, useState } from 'react';
// import { State } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/constants';
import './ActiveCall.css';

interface IActiveCall {
  callerID: string;
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
  answer: Function;
  hangup: Function;
}

function ActiveCall({ callerID, callState, answer, hangup }: IActiveCall) {
  console.log('callState:', callState);

  const handleAnswerClick = () => answer();
  const handleRejectClick = () => hangup();
  const handleHangupClick = () => hangup();

  return (
    <section>
      {callState === 'ringing' && (
        <div className="App-section">
          <div>Incoming call</div>
          <div className="ActiveCall-callerId">{callerID}</div>
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

      {callState === 'active' && (
        <div className="App-section">
          <div>Call in progress</div>
          <div className="ActiveCall-callerId">{callerID}</div>
          <div className="ActiveCall-actions">
            <button
              type="button"
              className="App-button App-button--danger"
              onClick={handleHangupClick}
            >
              Hangup
            </button>
            {/* TODO Mute */}
            {/* <button type="button" className="App-button App-button--tertiary">
              Mute
            </button> */}
          </div>
        </div>
      )}

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
