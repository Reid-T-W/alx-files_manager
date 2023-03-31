const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

export function getStatus(req, res) {
  const redis = redisClient.isAlive() || false;
  const db = dbClient.isAlive() || false;

  return res.json({ redis, db });
}

export function getStats(req, res) {
  const users = dbClient.nbUsers();
  const files = dbClient.nbFiles();

  return res.json({ users, files });
}
