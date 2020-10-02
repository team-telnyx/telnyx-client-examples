import { useState } from 'react';
import { getLoggedInAgents } from '../services/agentsService';
import IAgent from '../interfaces/IAgent';
import useInterval from '../hooks/useInterval';

function useAgents(sipUsername: string) {
  let [loading, setLoading] = useState<boolean>(true);
  let [error, setError] = useState<string | undefined>();
  let [agents, setAgents] = useState<IAgent[] | undefined>();

  function loadLoggedInAgents() {
    setLoading(true);

    return getLoggedInAgents()
      .then((res) => {
        let otherAgents = res.data.agents.filter(
          (agent) => agent.sipUsername !== sipUsername
        );

        setAgents(otherAgents);
      })
      .catch((error) => {
        setError(error.toString());
      })
      .finally(() => setLoading(false));
  }

  useInterval(loadLoggedInAgents, 5000);

  return { loading, error, agents };
}

export default useAgents;
