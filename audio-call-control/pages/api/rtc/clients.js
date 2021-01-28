// Development-only database--you'll want to replace the CSV with a real database in production
import csvdb from 'csv-database';

const clientsDBConnector = () =>
  csvdb('tmp/clients.csv', ['caller_id', 'sip_username', 'logged_in']);

async function saveToDb(payload) {
  const clientsDB = await clientsDBConnector();

  const entries = await clientsDB.edit(
    { caller_id: payload.caller_id },
    payload
  );

  if (!entries.length) {
    await clientsDB.add(payload);
  }
}

async function getInDB(query) {
  const clientsDB = await clientsDBConnector();
  const results = await clientsDB.get(query);

  return results[0];
}

// POST /api/rtc/clients, { caller_id: '', sip_username: '', logged_in: 'true' }
// GET /api/rtc/clients?caller_id=
export default async (req, res) => {
  const clientsDB = await csvdb('tmp/clients.csv', [
    'caller_id',
    'sip_username',
    'logged_in',
  ]);

  if (req.method === 'POST') {
    console.log('/api/rtc/clients req.body:', req.body);

    const payload = req.body;

    saveToDb(payload);

    res.statusCode = 200;
    res.json({
      data: payload,
    });
  } else if (req.method === 'GET') {
    console.log('/api/rtc/clients req.query:', req.query);

    const client = await getInDB({ caller_id: req.query.caller_id });

    res.statusCode = 200;
    res.json({
      data: client || {},
    });
  }
};
