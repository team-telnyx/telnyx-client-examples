import React, { FormEvent } from 'react';
import './Login.css';
import { AxiosError } from 'axios';
import { login } from '../services/loginService';
import { User } from '../interfaces/User';

function Login({ user, onLogin }: ILogin) {
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const result = await login('Hugo Oliveira');

    if ('data' in result) {
      console.log('Success');
      onLogin({ ...user, isLoggedin: true });
    }

    onLogin({
      ...user,
      isLoggedin: true,
      error: `Failed ${(result as AxiosError).response?.data?.error?.message}`,
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
            value="Hugo Oliveira"
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

interface ILogin {
  user: User;
  onLogin: Function;
}

export default Login;
