import TestFactory from '../TestFactory';

jest.mock('../services/telephonyCredentials.service', () => ({
  getTelephonyCredentials: () => ({
    data: {
      data: {
        sip_username: 'fake_telephony_sip_username',
      },
    },
  }),
  postTelephonyCredentialsToken: () => ({
    data: 'fake_telephony_cred_token',
  }),
}));

const testFactory = new TestFactory();

beforeAll(async () => {
  await testFactory.init();
  await testFactory.loadFixtures();
});

afterAll(async () => {
  await testFactory.close();
});

test('GET /', () =>
  testFactory.app
    .get('/agents')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agents).toHaveLength(3);
    }));

test('GET /:id', () =>
  testFactory.app
    .get('/agents/agent1')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agent).toMatchObject({
        id: 'agent1',
      });
    }));

test('PATCH /:id', () =>
  testFactory.app
    .patch('/agents/agent1')
    .send({
      available: false,
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agent).toMatchObject({
        available: false,
      });
    }));

test.only('POST /login', () => {
  const name = 'Agent 4';

  return testFactory.app
    .post('/agents/login')
    .send({
      name,
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agent).toMatchObject({
        name,
        sipUsername: 'fake_telephony_sip_username',
        loggedIn: true,
        available: false,
      });
      expect(resp.body.token).toEqual('fake_telephony_cred_token');
      expect(resp.body.credential).toEqual({
        sip_username: 'fake_telephony_sip_username',
      });
    });
});
