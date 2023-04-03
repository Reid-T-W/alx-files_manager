const sha1 = require('sha1');
const dbClient = require('../utils/db');

export async function createUser(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  // check if user already exists
  const users = dbClient.db.collection('users');
  let user = await users.findOne({ email });
  if (user) {
    return res.status(400).json({ error: 'Already exists' });
  }

  // create user
  const hashedPassword = sha1(password);
  user = await users.insertOne({
    email,
    password: hashedPassword,
  });

  return res.status(201).json({ id: user.insertedId, email });
}

export async function play(req, res) {
  console.log(req);
  console.log(res);
}