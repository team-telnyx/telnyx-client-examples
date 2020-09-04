import React, { useState, Fragment } from 'react';
import Login from './components/Login';
import 'normalize.css';
import './App.css';
import Common from './components/Common';
import { logout } from './services/loginService';

function App() {
  const agent = {
    id: 0,
    createdAt: '',
    loggedIn: false,
    name: '',
    sipUsername: '',
  };

  const [user, setUser] = useState({
    error: '',
    agent: {
      ...agent,
    },
  });

  const handleLogout = async () => {
    if (user.agent.id && user.agent.id > 0) {
      try {
        await logout(user.agent.id);
        setUser({
          ...user,
          agent: {
            ...agent,
          },
        });
      } catch (error) {
        setUser({ ...user, error: error });
      }
    }
  };

  return (
    <main className="App">
      {!user.agent.loggedIn ? (
        <Login user={user} onLogin={setUser}></Login>
      ) : (
        <Fragment>
          <Common></Common>
          <footer>
            <button
              type="button"
              className="App-button App-button--link"
              onClick={handleLogout}
            >
              Logout
            </button>
          </footer>
        </Fragment>
      )}
    </main>
  );
}

export default App;
