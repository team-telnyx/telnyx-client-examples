import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Call Center Login</h1>
      </header>

      <main>
        <section className="App-section">
          <form>
            <label htmlFor="display_name_input">Name</label>
            <div>
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

        <section className="App-section">
          <h2>Other available agents</h2>

          <ul>
            <li>
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
            <li>
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
            <li>
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
          <form>
            <label htmlFor="phone_number_input">Phone number</label>
            <div>
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
            <div>+13125551111</div>
            <div>
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
            <div>+13125551111</div>
            <div>
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
            <div>+13125551111</div>
            <div>+ Agent Name</div>
            <div>+ Agent Name</div>
            <div>
              <button type="button" className="App-button App-button--danger">
                Hangup
              </button>
              <button type="button" className="App-button App-button--tertiary">
                Mute
              </button>
            </div>
          </div>
        </section>

        <footer>
          <button type="button" className="App-button">
            Logout
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
