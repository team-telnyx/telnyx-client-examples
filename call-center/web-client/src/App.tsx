import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Call Center Login</h1>
      </header>

      <main>
        <form>
          <label htmlFor="display_name_input">Name</label>
          <div>
            <input
              id="display_name_input"
              className="App-form-input"
              name="display_name"
              type="text"
            />
            <button type="submit" className="App-button">
              Login
            </button>
          </div>
        </form>

        <section>
          <h2>Other available agents</h2>

          <ul>
            <li>
              <div>Agent Name</div>
            </li>
            <li>
              <div>Agent Name</div>
            </li>
            <li>
              <div>Agent Name</div>
            </li>
          </ul>
        </section>

        <form>
          <label htmlFor="phone_number_input">Phone number</label>
          <div>
            <input
              id="phone_number_input"
              className="App-form-input"
              name="phone_number"
              type="text"
            />
            <button type="submit" className="App-button">
              Call
            </button>
          </div>
        </form>

        <section>
          <div>
            <div>Incoming call</div>
            <div>+13125551111</div>
            <div>
              <button type="button" className="App-button">
                Answer
              </button>
              <button type="button" className="App-button">
                Hangup
              </button>
            </div>
          </div>

          <div>
            <div>Call in progress</div>
            <div>+13125551111</div>
            <div>
              <button type="button" className="App-button">
                Hangup
              </button>
              <button type="button" className="App-button">
                Mute
              </button>
            </div>
          </div>

          <div>
            <div>Conference call in progress</div>
            <div>+13125551111</div>
            <div>+ Agent Name</div>
            <div>+ Agent Name</div>
            <div>
              <button type="button" className="App-button">
                Hangup
              </button>
              <button type="button" className="App-button">
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
