import React from 'react';
import './Login.css';

class Login extends React.Component {
  render() {
    return (
      <section className="Login">
        <header>
          <h1 className="App-heading App-title">Call Center Login</h1>
        </header>

        <form className="App-form">
          <label className="App-input-label" htmlFor="display_name_input">
            Name
          </label>
          <div className="App-form-row">
            <input
              id="display_name_input"
              className="App-input"
              name="display_name"
              type="text"
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
