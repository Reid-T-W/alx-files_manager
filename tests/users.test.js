const {
  expect, use, should, request,
} = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { ObjectId } = require('mongodb');
const { before, after } = require('mocha');
const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

use(chaiHttp);
should();

// Users related tests

describe('testing User related endpoints', () => {
  const authorization = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
  let token = '';
  let userId = '';
  const user = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };

  before(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.db.collections('users').deleteMany({});
    await dbClient.db.collections('files').deleteMany({});
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.db.collections('users').deleteMany({});
    await dbClient.db.collections('files').deleteMany({});
  });

  // users
  describe('/users', () => {
    it('creates new user and returns the id and email of new user', async () => {
      expect.assertions(4);
      const response = await request(app).post('/users').send(user);
      const data = JSON.parse(response.text);
      expect(data.email).to.equal(user.email);
      expect(data).to.have.property('id');
      expect(response.statusCode).to.equal(201);

      userId = data.id;
      const findUser = await dbClient.db.collections('users').findOne({
        _id: ObjectId(data.id),
      });
      expect(findUser).to.exist;
    });

    it('returns error because password is missing', async () => {
      expect.assertions(2);
      const user = {
        email: 'bob@dylan.com',
      };
      const response = await request(app).post('/users').send(user);
      const data = JSON.parse(response.text);
      expect(data).to.eql({ error: 'Missing password' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns error because email is missing', async () => {
      expect.assertions(2);
      const user = {
        password: 'toto1234!',
      };
      const response = await request(app).post('/users').send(user);
      const data = JSON.parse(response.text);
      expect(data).to.eql({ error: 'Missing email' });
      expect(response.statusCode).to.equal(400);
    });

    it('fails to create existing user', async () => {
      expect.assertions(2);
      const user = {
        email: 'bob@dylan.com',
        password: 'toto1234!',
      };

      const response = await request(app).post('/users').send(user);
      const data = JSON.parse(response.text);
      expect(data).to.eql({ error: 'Already exist' });
      expect(response.statusCode).to.equal(400);
    });
  });

  // Connect
  describe('/connect', () => {
    it('fails on missing credentials', async () => {
      expect.assertions(2);
      const response = await request(app).get('/connect').send();
      const data = JSON.parse(response.text);
      expect(data).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('returns token on successful login', async () => {
      expect.assertions(3);
      const RedisSet = sinon.spy(redisClient, 'set');

      const response = await request(app)
        .get('/connect')
        .set('Authorization', authorization)
        .send();
      const data = JSON.parse(response.text);
      token = data.token;
      expect(data).to.have.property('token');
      expect(response.statusCode).to.equal(200);
      expect(
        RedisSet.calledOnceWithExactly(`auth_${token}`, userId, 24 * 3600),
      ).to.be.true;

      RedisSet.restore();
    });

    it('token exists in redis', async () => {
      expect.assertions(1);
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.exist;
    });
  });

  // Disconnect
  describe('/disconnect', () => {
    after(async () => {
      await redisClient.client.flushall('ASYNC');
    });

    it('returns unauthorized', async () => {
      expect.assertions(2);
      const response = await request(app).get('/disconnect').send();
      const data = JSON.parse(response.text);
      expect(data).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('sign-out user', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/disconnect')
        .set('X-Token', token)
        .send();
      expect(response.text).to.be.equal('');
      expect(response.statusCode).to.equal(204);
    });

    it('check token has been deleted from redis', async () => {
      expect.assertions(1);
      const redisToken = await redisClient.get(`auth_${token}`);
      expect(redisToken).to.not.exist;
    });
  });

  describe('gET /users/me', () => {
    before(async () => {
      const response = await request(app)
        .get('/connect')
        .set('Authorization', authorization)
        .send();
      const data = JSON.parse(response.text);
      token = data.token;
    });

    it('returns unauthorized', async () => {
      expect.assertions(2);
      const response = await request(app).get('/users/me').send();
      const data = JSON.parse(response.text);

      expect(data).to.be.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('get user', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/users/me')
        .set('X-Token', token)
        .send();
      const data = JSON.parse(response.text);

      expect(data).to.be.eql({ id: userId, email: user.email });
      expect(response.statusCode).to.equal(200);
    });
  });
});
