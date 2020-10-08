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
}));

module.exports.callMock = callMock;
module.exports.conferenceMock = conferenceMock;
module.exports.callsCreateMock = callsCreateMock;
