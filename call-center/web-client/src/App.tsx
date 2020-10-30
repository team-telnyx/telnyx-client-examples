import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Common from './components/Common';
import { logout } from './services/loginService';
import { getAgent } from './services/agentsService';
import { IAgent, ILoggedInAgent } from './interfaces/IAgent';
import useSessionStorage from './hooks/useSessionStorage';

interface ISessionStorageUser {
  id?: string;
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

  useEffect(() => {
    let { id } = sessionStorageUser;

    const resumeSession = async (id: any) => {
      let result = await getAgent(id);

      if ('data' in result && result?.data?.agent) {
        setAgent(result.data.agent);
      } else {
        setSessionStorageUser({});
      }
    };

    if (id) {
      resumeSession(id);
    }
  }, []);

  return (
    <main className="App">
      {!agent || !sessionStorageUser.token ? (
        <Login agent={agent} onLogin={handleLogin}></Login>
      ) : (
        <div className="App-container">
          <div className="App-content">
            <h1 className="App-heading App-title">Call Center</h1>
            <header className="App-header-login">
              Logged in as <b>{agent.name}</b>
            </header>
          </div>
          <div className="App-main-content">
            <Common
              agentId={agent.id}
              agentSipUsername={agent.sipUsername}
              agentName={agent.name}
              token={sessionStorageUser.token}
            ></Common>
          </div>
          <footer className="App-content">
            <button
              type="button"
              className="App-button App-button--link"
              onClick={handleLogout}
            >
              Logout
            </button>

            {error && error.length > 0 && <p className="App-error">{error}</p>}
          </footer>
        </div>
      )}
    </main>
  );
}

export default App;
