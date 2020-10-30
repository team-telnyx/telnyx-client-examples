import React, { FormEvent, useState } from 'react';
import './Login.css';
import { AxiosError } from 'axios';
import { login } from '../services/loginService';
import ILogin from '../interfaces/ILogin';

function Login({ agent, onLogin }: ILogin) {
  const [agentName, setAgentName] = useState('');
  const [error, setError] = useState('');

  const handleChangeAgentName = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAgentName(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (agentName) {
      const result = await login(agentName);

      if ('data' in result && result.data) {
        setError('');

        return onLogin({
          ...agent,
          ...result.data.agent,
          token: result.data.token,
        });
      }

      setError(
        `Failed ${(result as AxiosError).response?.data?.error?.message}`
      );

      return onLogin({
        ...agent,
        token: null,
      });
    }

    return onLogin({
      ...agent,
      error:
        'Please provide your name. This will be visible to callers and other agents.',
    });
  };

  return (
    <section className="Login">
      <header>
        <h1 className="App-heading App-title">Call Center Login</h1>
      </header>

      <form className="App-form" onSubmit={handleSubmit}>
        <label className="App-input-label" htmlFor="name_input">
          Name
        </label>
        <div className="App-form-row">
          <input
            id="name_input"
            className="App-input"
            name="name"
            type="text"
            value={agentName}
            onChange={handleChangeAgentName}
            required
          />
          <button type="submit" className="App-button App-button--primary">
            Login
          </button>
        </div>
      </form>
      {error && error.length > 0 && <p className="App-error">{error}</p>}
    </section>
  );
}

export default Login;
