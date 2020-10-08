class Call {
  answer = () => {};
}

const telnyx = {
  Call,
};

module.exports = function () {
  return telnyx;
};
