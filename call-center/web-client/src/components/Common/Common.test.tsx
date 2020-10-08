import React from 'react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BASE_URL } from '../../configs/constants';
import { IAgent } from '../../interfaces/IAgent';
import Common from '.';

jest.mock('@telnyx/webrtc');

const server = setupServer(
  rest.get(`${BASE_URL}/agents`, (req, res, ctx) => {
    return res(
      ctx.json({
        agents: [] as IAgent[],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Renders an audio element', async () => {
  render(
    <Common
      agentId="1234"
      agentSipUsername="gencred1234"
      agentName="Test Agent"
      token="token1234"
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Active call')).toHaveAttribute('autoPlay');
  });
});
