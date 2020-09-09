import React, { useEffect, useRef } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';

interface ICommon {
  // User's WebRTC JWT
  token: string;
}

function Common({ token }: ICommon) {
  const telnyxClientRef = useRef<any>();

  useEffect(() => {
    const telnyxClient = new TelnyxRTC({
      // Required credentials
      login_token: token,
    });

    telnyxClient.on('telnyx.ready', () => {
      console.log('ready');
    });

    telnyxClient.on('telnyx.error', (error: any) => {
      console.error('error:', error);
    });

    telnyxClient.on('telnyx.socket.close', () => {
      console.log('close');

      telnyxClient.disconnect();
    });

    telnyxClient.on('telnyx.notification', (notification: any) => {
      console.log('notification:', notification);
    });

    telnyxClientRef.current = telnyxClient;
    telnyxClientRef.current.connect();
  }, [token]);

  return (
    <div>
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
    </div>
  );
}
export default Common;
