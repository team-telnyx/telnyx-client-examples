import React from 'react';
import logo from './logo.svg';
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
            <input id="display_name_input" name="display_name" type="text" />
            <button type="submit">Login</button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;
