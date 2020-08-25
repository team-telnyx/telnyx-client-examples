let express = require('express');

let app: express.Application = express();

app.get('/', function (req, res) {
  res.send('Hello world');
});

app.listen(3000, function () {
  console.log(`App is listening on post 3000`);
});
