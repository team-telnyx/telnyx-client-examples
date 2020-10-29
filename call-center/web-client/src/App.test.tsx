import React from 'react';
import ReactDOM from 'react-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, getByText } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom/extend-expect';
import { BASE_URL } from './configs/constants';
import { IAgent } from './interfaces/IAgent';
import App from './App';

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

let container: any;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

it('Renders login', async () => {
  // Test first render and componentDidMount
  act(() => {
    ReactDOM.render(<App />, container);
  });

  const label = container.querySelector('.App-heading.App-title');
  expect(label.textContent).toBe('Call Center Login');

  const inputName = container.querySelector('#name_input') as HTMLInputElement;
  inputName.value = 'Deivid';

  expect(inputName.value).toEqual('Deivid');

  const button = container.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement;

  fireEvent(
    getByText(button, 'Login'),
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    })
  );
});
