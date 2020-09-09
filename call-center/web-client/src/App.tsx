import React, { useState, useEffect, Fragment } from 'react';
import './App.css';
import Login from './components/Login';
import Common from './components/Common';
import { logout } from './services/loginService';
import { getAgent } from './services/agentsService';
import { IAgent, ILoggedInAgent } from './interfaces/IAgent';
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

  const [agent, setAgent] = useState<IAgent | undefined>(undefined);
  const [error, setError] = useState<string>('');

  const handleLogin = async (loggedInAgent: ILoggedInAgent) => {
    const { token, ...agentProps } = loggedInAgent;

    setSessionStorageUser({
      id: agentProps.id,
      name: agentProps.name,
      token,
    });

    setAgent(agentProps);
  };

  const handleLogout = async () => {
    setError('');

    if (agent && agent.id) {
      try {
        await logout(agent.id);

        setSessionStorageUser({});
        setAgent(undefined);
      } catch (error) {
        console.error(error);

        setAgent({ ...agent });
        setError('Something went wrong, could not log out');
      }
    }
  };

  const resumeSession = async (id: any) => {
    let result = await getAgent(id);

    if ('data' in result && result?.data?.agent) {
      setAgent(result.data.agent);
    }
  };

  useEffect(() => {
    let { id } = sessionStorageUser;

    if (id) {
      resumeSession(id);
    }
  }, [sessionStorageUser]);

  return (
    <main className="App">
      {!agent || !sessionStorageUser.token ? (
        <Login agent={agent} onLogin={handleLogin}></Login>
      ) : (
        <Fragment>
          <header>Logged in as {agent.name}</header>
          <Common token={sessionStorageUser.token}></Common>
          <footer>
            <button
              type="button"
              className="App-button App-button--link"
              onClick={handleLogout}
            >
              Logout
            </button>

            {error && error.length > 0 && <p className="App-error">{error}</p>}
          </footer>
        </Fragment>
      )}
    </main>
  );
}

export default App;
