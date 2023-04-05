const {
  expect, use, should, request,
} = require('chai');
const chaiHttp = require('chai-http');
const { before } = require('mocha');
const app = require('../server');
const dbClient = require('../utils/db');

use(chaiHttp);
should();

// General test

describe('testing app status', () => {
  describe('/stats', () => {
    before(async () => {
      await dbClient.db.collection('users').deleteMany({});
      await dbClient.db.collection('files').deleteMany({});
    });

    it('returns number of users and files in db, 0', async () => {
      expect.assertions(2);
      const response = await request(app).get('/stats').send();
      const data = JSON.parse(response.text);

      expect(data).to.eql({ users: 0, files: 0 });
      expect(response.statusCode).to.equal(200);
    });

    it('returns number of users and files in db, 2 each', async () => {
      expect.assertions(2);
      await dbClient.db.collection('users').insertOne({ name: 'Jane' });
      await dbClient.db.collection('users').insertOne({ name: 'Donald' });
      await dbClient.db.collection('files').insertOne({ name: 'test.png' });
      await dbClient.db.collection('files').insertOne({ name: 'test.txt' });

      const response = await request(app).get('/stats').send();
      const data = JSON.parse(response.text);

      expect(data).to.eql({ users: 2, files: 2 });
      expect(response.statusCode).to.equal(200);
    });
  });

  describe('/status', () => {
    it('check the status of redis and mongodb', async () => {
      expect.assertions(2);
      const response = await request(app).get('/status').send();
      const data = JSON.parse(response.text);

      expect(data).to.eql({ redis: true, db: true });
      expect(response.statusCode).to.equal(200);
    });
  });
});
