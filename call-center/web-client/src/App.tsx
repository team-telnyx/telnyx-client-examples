import React, { useState, Fragment } from 'react';
import Login from './components/Login';
import 'normalize.css';
import './App.css';
import Common from './components/Common';

function App() {
  const [user, setUser] = useState({ isLoggedin: false, error: '' });

  return (
    <main className="App">
      {!user.isLoggedin ? (
        <Login user={user} onLogin={setUser}></Login>
      ) : (
        <Fragment>
          <Common></Common>
          <footer>
            <button type="button" className="App-button App-button--link">
              Logout
            </button>
          </footer>
        </Fragment>
      )}
    </main>
  );
}

export default App;
