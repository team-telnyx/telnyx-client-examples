// TODO use same constants as `VideoCall`
const START_RECORDING_DTMF_KEY = '1';

export default (req, res) => {
  console.log('api/texml/status req.body: ', req.body);

  res.send('Success');
};
