import React, { Component, FormEvent } from 'react';
import PropTypes from 'prop-types';
import './Login.css';
import { AxiosError, AxiosResponse } from 'axios';
import { login } from '../services/loginService';

class Login extends Component {
  handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await login('Hugo Oliveira');
    if ('data' in result) {
      console.log('Success');
    }
    console.log(
      `Failed ${(result as AxiosError).response?.data?.error?.message}`
    );
  };

  render() {
    return (
      <section className="Login">
        <header>
          <h1 className="App-heading App-title">Call Center Login</h1>
        </header>

        <form className="App-form" onSubmit={this.handleSubmit}>
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
      </section>
    );
  }
}
export default Login;
