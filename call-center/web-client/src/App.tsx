import React, { useState, useEffect, Fragment } from 'react';
import './App.css';
import Login from './components/Login';
import Common from './components/Common';
import { logout } from './services/loginService';
import { getAgent } from './services/agentsService';
import IUser from './interfaces/IUser';
import useLocalStorage from './hooks/useLocalStorage';

interface ILocalStorageUser {
  id?: number | string;
  name?: string;
}

function App() {
  const [localStorageUser, setLocalStorageUser] = useLocalStorage<
    ILocalStorageUser
  >('call_center_user', {});

  const [user, setUser] = useState<IUser | undefined>(undefined);

  const handleLogin = async (user: IUser) => {
    setLocalStorageUser({
      id: user.id,
      name: user.name,
    });

    setUser(user);
  };

  const handleLogout = async () => {
    if (user && user.id) {
      try {
        await logout(user.id);

        setLocalStorageUser({});
        setUser(undefined);
      } catch (error) {
        setUser({ ...user, error: error });
      }
    }
  };

  const resumeSession = async (id: any) => {
    let result = await getAgent(id);

    if ('data' in result && result?.data?.agent) {
      setUser(result.data.agent);
    }
  };

  useEffect(() => {
    let { id } = localStorageUser;

    if (id) {
      resumeSession(id);
    }
  }, []);

  return (
    <main className="App">
      {!user || !user.loggedIn ? (
        <Login user={user} onLogin={handleLogin}></Login>
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
