import express from 'express'

let router = express.Router();
let app = express();

router.post('/callbacks/call-control-app', function (req, res) {
  console.log('req body', req.body);
  res.json({});
});

export default router;
