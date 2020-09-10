import React, { useEffect, useRef, useState } from 'react';
import { TelnyxRTC, ICall as ITelnyxCall } from '@telnyx/webrtc';
import { updateAgent } from '../services/agentsService';
import ActiveCall from './ActiveCall';

interface ICommon {
  agentId: string;
  // User's WebRTC JWT
  token: string;
}

function Common({ agentId, token }: ICommon) {
  // Save the Telnyx WebRTC client as a ref as to persist
  // the client object through component updates
  let telnyxClientRef = useRef<TelnyxRTC>();
  // Check if component is mounted before updating state
  // in the Telnyx WebRTC client callbacks
  let isMountedRef = useRef<boolean>(false);
  let [webRTCState, setWebRTCState] = useState<string>('');
  let [telnyxCall, setTelnyxCall] = useState<ITelnyxCall>();

  const updateWebRTCState = (state: string) => {
    if (isMountedRef.current) {
      setWebRTCState(state);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const telnyxClient = new TelnyxRTC({
      // Required credentials:
      login_token: token,
    });

    telnyxClient.on('telnyx.ready', () => {
      console.log('ready');

      updateWebRTCState('ready');

      updateAgent(agentId, { available: true });
    });

    telnyxClient.on('telnyx.error', (error: any) => {
      console.error('error:', error);

      updateWebRTCState('error');
    });

    telnyxClient.on('telnyx.socket.close', () => {
      console.log('close');

      telnyxClient.disconnect();

      updateWebRTCState('disconnected');
    });

    telnyxClient.on('telnyx.notification', (notification: any) => {
      console.log('notification:', notification);

      if (notification.call) {
        // Get a simplified call object by modifying
        // the call with `.telnyxStateCall`
        let telnyxCall = TelnyxRTC.telnyxStateCall(notification.call);

        setTelnyxCall(notification.call);
      }
    });

    telnyxClientRef.current = telnyxClient;
    telnyxClientRef.current.connect();

    return () => {
      isMountedRef.current = false;

      telnyxClientRef.current?.disconnect();
      telnyxClientRef.current = undefined;
    };
  }, [token]);

  return (
    <div>
      <section className="App-section">WebRTC status: {webRTCState}</section>

      <section className="App-section">
        <h2 className="App-heading App-headline">Other available agents</h2>

        <ul className="App-agentList">
          <li className="App-agentList-item">
            <div>Agent Name</div>
            <div>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Transfer
              </button>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Add
              </button>
            </div>
          </li>
          <li className="App-agentList-item">
            <div>Agent Name</div>
            <div>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Transfer
              </button>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Add
              </button>
            </div>
          </li>
          <li className="App-agentList-item">
            <div>Agent Name</div>
            <div>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Transfer
              </button>
              <button
                type="button"
                className="App-button App-button--secondary"
              >
                Add
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section className="App-section">
        <form className="App-form">
          <label className="App-input-label" htmlFor="phone_number_input">
            Phone number
          </label>
          <div className="App-form-row">
            <input
              id="phone_number_input"
              className="App-input"
              name="phone_number"
              type="text"
            />
            <button type="submit" className="App-button App-button--primary">
              Call
            </button>
          </div>
        </form>
      </section>

      {telnyxCall && <ActiveCall callState={telnyxCall.state} />}
    </div>
  );
}
export default Common;
