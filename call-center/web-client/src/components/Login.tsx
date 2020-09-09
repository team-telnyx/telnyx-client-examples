import React, { FormEvent, useState } from 'react';
import './Login.css';
import { AxiosError } from 'axios';
import { login } from '../services/loginService';
import useLocalStorage from '../hooks/useLocalStorage';
import IUser from '../interfaces/IUser';

interface ILogin {
  user: IUser | undefined;
  onLogin: Function;
}

function Login({ user, onLogin }: ILogin) {
  const [userName, setUserName] = useLocalStorage('call_center_user_name', '');

  const handleUserName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (userName) {
      const result = await login(userName);

      if ('data' in result && result.data) {
        return onLogin({
          ...user,
          ...result.data.agent,
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
