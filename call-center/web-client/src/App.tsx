import React, { useState, useEffect, Fragment } from 'react';
import './App.css';
import Login from './components/Login';
import Common from './components/Common';
import { logout } from './services/loginService';
import { getAgent } from './services/agentsService';
import IAgent from './interfaces/IAgent';
import IUser from './interfaces/IUser';
import useSessionStorage from './hooks/useSessionStorage';

interface ISessionStorageUser {
  id?: number | string;
  name?: string;
  token?: string;
}

function App() {
  const [sessionStorageUser, setSessionStorageUser] = useSessionStorage<
    ISessionStorageUser
  >('call_center_user', {});

  const [user, setUser] = useState<IAgent | undefined>(undefined);

  const handleLogin = async (user: IUser) => {
    const { token, ...agent } = user;

    setSessionStorageUser({
      id: user.id,
      name: user.name,
      token: user.token,
    });

    setUser(agent);
  };

  const handleLogout = async () => {
    if (user && user.id) {
      try {
        await logout(user.id);

        setSessionStorageUser({});
        setUser(undefined);
      } catch (error) {
        setUser({ ...user });
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
    let { id } = sessionStorageUser;

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
          <header>Logged in as {user.name}</header>
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
