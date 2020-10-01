import React, { useState } from 'react';
import { TelnyxRTC } from '@telnyx/webrtc';
import { IWebRTCCall } from '@telnyx/webrtc/lib/Modules/Verto/webrtc/interfaces';
import { updateAgent } from '../services/agentsService';
import ActiveCall from './ActiveCall';
import Agents from './Agents';

interface IDialer {
  dial: Function;
}

function Dialer({ dial }: IDialer) {
  let [destination, setDestination] = useState('');

  const handleChangeDestination = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDestination(event.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    dial(destination);
  };

  return (
    <section className="App-section">
      <form className="App-form" onSubmit={handleSubmit}>
        <label className="App-input-label" htmlFor="destination_input">
          Destination
        </label>
        <div className="App-form-row">
          <input
            id="destination_input"
            className="App-input"
            name="destination"
            type="text"
            value={destination}
            placeholder="Phone number or SIP URI"
            required
            onChange={handleChangeDestination}
          />
          <button type="submit" className="App-button App-button--primary">
            Call
          </button>
        </div>
      </form>
    </section>
  );
}
export default Dialer;
