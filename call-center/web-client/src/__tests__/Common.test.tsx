import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BASE_URL } from '../configs/constants';
import { IAgent } from '../interfaces/IAgent';
import Common from '../components/Common';

const server = setupServer(
  rest.get(`${BASE_URL}/agents`, (req, res, ctx) => {
    return res(
      ctx.json({
        agents: [
          {
            id: '1',
            createdAt: '2020-01-01',
            loggedIn: true,
            name: 'Agent 1',
            sipUsername: 'agent1',
            available: true,
          },
          {
            id: '2',
            createdAt: '2020-01-01',
            loggedIn: true,
            name: 'Agent 2',
            sipUsername: 'agent2',
            available: true,
          },
        ] as IAgent[],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Loads and displays agents when there is no active call', async () => {
  render(
    <Common
      agentId="1234"
      agentSipUsername="gencred1234"
      agentName="Test Agent"
      token="token1234"
    />
  );

  await waitFor(() => screen.getByText('Other agents'));

  expect(screen.getByRole('list')).toHaveTextContent('Agent 1');
  expect(screen.getByRole('list')).toHaveTextContent('Agent 2');
});
