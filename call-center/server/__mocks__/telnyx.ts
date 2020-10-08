class Call {
  answer = () => {};
}

class Conference {
  unmute = () => {};
  mute = () => {};
}

const telnyx = {
  Call,
  Conference,
};

module.exports = function () {
  return telnyx;
};
