import React, { useRef, useState, useCallback, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import { logout } from './services/loginService';
import { getAgent } from './services/agentsService';
import { IAgent, ILoggedInAgent } from './interfaces/IAgent';
import useSessionStorage from './hooks/useSessionStorage';

import * as callsService from './services/callsService';
import useAgents from './hooks/useAgents';
import ActiveCall from './components/ActiveCall';
import Agents from './components/Agents';
import Dialer from './components/Dialer';
import LoadingIcon from './components/LoadingIcon';
import useTelnyxRTC from './hooks/useTelnyxRTC';
import ISessionStorageUser from './interfaces/ISessionStorageUser';

function App() {
  const [sessionStorageUser, setSessionStorageUser] = useSessionStorage<
    ISessionStorageUser
  >('call_center_user', {});

  const [agent, setAgent] = useState<IAgent | undefined>(undefined);
  const [error, setError] = useState<string>('');

  let audioRef = useRef<HTMLAudioElement>(null);

  let [dialingDestination, setDialingDestination] = useState<string | null>();

  let { telnyxClientRef, webRTCall, webRTCClientState } = useTelnyxRTC(
    agent?.id,
    sessionStorageUser?.token,
    setDialingDestination
  );

  let agentsState = useAgents(agent?.sipUsername);

  const dial = useCallback(
    (destination) => {
      let dialParams = {
        initiatorSipUsername: agent?.sipUsername,
        to: destination,
      };

      setDialingDestination(destination);

      callsService.dial(dialParams);
    },
    [telnyxClientRef.current]
  );

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

  // Set up remote stream to hear audio from incoming calls
  if (audioRef.current && webRTCall && webRTCall.remoteStream) {
    audioRef.current.srcObject = webRTCall.remoteStream;
  }

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
            <div>
              <section
                className="App-section App-marginTop--small"
                style={{ textAlign: 'center' }}
              >
                WebRTC status: {webRTCClientState}
              </section>

              <audio
                ref={audioRef}
                autoPlay
                controls={false}
                aria-label="Active call"
              />

              {webRTCall && (
                <ActiveCall
                  telnyxCallControlId={webRTCall.options.telnyxCallControlId}
                  sipUsername={agent.sipUsername}
                  callDirection={webRTCall.direction}
                  callDestination={
                    dialingDestination || webRTCall.options.destinationNumber
                  }
                  isDialing={Boolean(dialingDestination)}
                  callerId={
                    webRTCall.options.remoteCallerName ||
                    webRTCall.options.remoteCallerNumber
                  }
                  callState={webRTCall.state}
                  answer={webRTCall.answer}
                  hangup={webRTCall.hangup}
                />
              )}

              {!webRTCall && (
                <div>
                  <section className="App-section">
                    <Dialer dial={dial} />
                  </section>

                  <section className="App-section App-marginTop--big">
                    <h2 className="App-headline">
                      Other available agents{' '}
                      {agentsState.loading && <LoadingIcon />}
                    </h2>

                    {agentsState.error && (
                      <p className="App-error">Error: {agentsState.error}</p>
                    )}

                    <Agents agents={agentsState.agents} />
                  </section>
                </div>
              )}
            </div>
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
