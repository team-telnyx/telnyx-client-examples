import React, { useState } from 'react';

interface IDialer {
  dial: Function;
}

function Dialer({ dial }: IDialer) {
  let [destination, setDestination] = useState('');
  let [serverError, setServerError] = useState('');

  const handleChangeDestination = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDestination(event.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    setServerError('');

    dial(destination).catch((err: any) => {
      console.error(err);

      setServerError(err.response?.data?.error || err.message);
    });
  };

  return (
    <section className="App-section App-marginTop--big">
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
            placeholder="Phone number in +E164 or SIP URI"
            required
            onChange={handleChangeDestination}
          />
          <button type="submit" className="App-button App-button--primary">
            Call
          </button>
        </div>
      </form>

      {serverError && serverError.length > 0 && (
        <p className="App-error">{serverError}</p>
      )}
    </section>
  );
}
export default Dialer;
