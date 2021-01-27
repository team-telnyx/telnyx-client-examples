export default (req, res) => {
  console.log('/api/sip-connection/webhook req.body:', req.body);

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
