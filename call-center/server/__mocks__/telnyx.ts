const callMock = {
  answer: jest.fn(),
  hangup: jest.fn(),
  bridge: jest.fn(),
};

const conferenceMock = {
  mute: jest.fn(),
  unmute: jest.fn(),
};

const callsCreateMock = jest.fn().mockImplementation(() => ({
  ...callMock,
  data: {
    call_control_id: 'fake_call_control_id',
  },
}));

const conferencesCreateMock = jest.fn().mockImplementation(() => ({
  ...conferenceMock,
  data: {
    id: 'fake_conference_id',
  },
}));

class Call {
  answer = callMock.answer;
  hangup = callMock.hangup;
}

class Conference {
  mute = conferenceMock.mute;
  unmute = conferenceMock.unmute;
}

module.exports = jest.fn().mockImplementation(() => ({
  Call,
  Conference,
  calls: {
    create: callsCreateMock,
  },
  conferences: {
    create: conferencesCreateMock,
  },
}));

module.exports.callMock = callMock;
module.exports.conferenceMock = conferenceMock;
module.exports.callsCreateMock = callsCreateMock;
module.exports.conferencesCreateMock = conferencesCreateMock;
