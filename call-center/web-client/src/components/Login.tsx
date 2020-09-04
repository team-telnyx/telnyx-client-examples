import React, { FormEvent, useState } from 'react';
import './Login.css';
import { AxiosError } from 'axios';
import { login } from '../services/loginService';
import { User } from '../interfaces/User';

interface ILogin {
  user: User;
  onLogin: Function;
}

function Login({ user, onLogin }: ILogin) {
  const [userName, setUserName] = useState('');

  const handleUserName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (userName) {
      const result = await login(userName);

      if ('data' in result) {
        return onLogin({
          ...user,
          agent: result.data.agent,
          error: '',
        });
      }
      return onLogin({
        ...user,
        error: `Failed ${
          (result as AxiosError).response?.data?.error?.message
        }`,
      });
    }
    return onLogin({
      ...user,
      error: 'Please, provide a username.',
    });
  };

  return (
    <section className="Login">
      <header>
        <h1 className="App-heading App-title">Call Center Login</h1>
      </header>

      <form className="App-form" onSubmit={handleSubmit}>
        <label className="App-input-label" htmlFor="display_name_input">
          Name
        </label>
        <div className="App-form-row">
          <input
            id="display_name_input"
            className="App-input"
            name="display_name"
            type="text"
            value={userName}
            onChange={handleUserName}
          />
          <button type="submit" className="App-button App-button--primary">
            Login
          </button>
        </div>
      </form>
      {user && user.error && user.error.length > 0 && (
        <p className="Login-error">{user.error}</p>
      )}
    </section>
  );
}

export default Login;
