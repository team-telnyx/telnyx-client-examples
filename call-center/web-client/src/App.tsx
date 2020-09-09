import React, { useState, Fragment } from 'react';
import './App.css';
import Login from './components/Login';
import Common from './components/Common';
import { logout } from './services/loginService';
import IUser from './interfaces/IUser';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [, setUserName] = useLocalStorage('call_center_user_name', '');
  const [user, setUser] = useState<IUser | undefined>(undefined);

  const handleLogout = async () => {
    if (user && user.id) {
      try {
        await logout(user.id);
        setUser(undefined);
        setUserName('');
      } catch (error) {
        setUser({ ...user, error: error });
      }
    }
  };

  return (
    <main className="App">
      {!user || !user.loggedIn ? (
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
