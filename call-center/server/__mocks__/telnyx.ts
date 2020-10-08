const callMock = {
  answer: jest.fn(),
  hangup: jest.fn(),
  bridge: jest.fn(),
};

const conferenceMock = {
  mute: jest.fn(),
  unmute: jest.fn(),
};

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
    create: () => ({
      bridge: callMock.bridge,
    }),
  },
}));

module.exports.callMock = callMock;
module.exports.conferenceMock = conferenceMock;
