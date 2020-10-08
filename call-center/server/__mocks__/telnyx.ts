const mockAnswer = jest.fn();
const mockHangup = jest.fn();
const mockMute = jest.fn();
const mockUnmute = jest.fn();

class Call {
  answer = mockAnswer;
  hangup = mockHangup;
}

class Conference {
  mute = mockMute;
  unmute = mockUnmute;
}

module.exports = jest.fn().mockImplementation(() => ({
  Call,
  Conference,
}));

module.exports.mockAnswer = mockAnswer;
module.exports.mockHangup = mockHangup;
module.exports.mockMute = mockMute;
module.exports.mockUnmute = mockUnmute;
