const { expect, use, should } = require('chai');
const chaiHttp = require('chai-http');
const { promisify } = require('util');
const { before, after } = require('mocha');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

use(chaiHttp);
should();

describe('testing MongoDB and Redis clients', () => {
  describe('redis', () => {
    before(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    after(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    it('connection is alive', async () => {
      expect.assertions(1);
      expect(redisClient.isAlive()).to.equal(true);
    });

    it('set key shouldn\' raise errors', async () => {
      expect.assertions(1);
      expect(await redisClient.set('John', 12, 1)).to.equal(undefined);
    });

    it('returns null for a non-existent key', async () => {
      expect.assertions(1);
      expect(await redisClient.get('frank')).to.equal(null);
    });

    it('returns null for expired key', async () => {
      expect.assertions(1);
      const sleep = promisify(setTimeout);
      await sleep(1100);
      expect(await redisClient.get('John')).to.equal(null);
    });
  });

  describe('db', () => {
    before(async () => {
      await dbClient.db.collection('users').deleteMany({});
      await dbClient.db.collection('files').deleteMany({});
    });
    after(async () => {
      await dbClient.db.collection('users').deleteMany({});
      await dbClient.db.collection('files').deleteMany({});
    });

    it('shows that connection is alive', () => {
      expect.assertions(1);
      expect(dbClient.isAlive()).to.equal(true);
    });

    it('checks number of user documents', async () => {
      expect.assertions(2);
      await dbClient.db.collection('users').deleteMany({});
      expect(await dbClient.nbUsers()).to.equal(0);

      await dbClient.db.collection('users').insertOne({ name: 'Lase' });
      await dbClient.db.collection('users').insertOne({ name: 'Rediet' });
      expect(await dbClient.nbUsers()).to.equal(2);
    });

    it('checks number of file documents', async () => {
      expect.assertions(2);
      await dbClient.db.collection('files').deleteMany({});
      expect(await dbClient.nbFiles()).to.equal(0);

      await dbClient.db.collection('files').insertOne({ name: 'One' });
      await dbClient.db.collection('files').insertOne({ name: 'Two' });
      expect(await dbClient.nbUsers()).to.equal(2);
    });
  });
});
