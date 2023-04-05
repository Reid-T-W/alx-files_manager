const {
  expect, use, should, request,
} = require('chai');
const chaiHttp = require('chai-http');
const { ObjectId } = require('mongodb');
const { exec } = require('child_process');
const { before, after } = require('mocha');
const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

use(chaiHttp);
should();

// Files related tests

describe('test File Endpoints', () => {
  const credentials = 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=';
  let token = '';
  let userId = '';
  let fileId = '';
  let parentId = '';

  const user = {
    email: 'bob@dylan.com',
    password: 'toto1234!',
  };

  before(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.db.collections('users').deleteMany({});
    await dbClient.db.collections('files').deleteMany({});

    let response; let
      body;

    response = await request(app).post('/users').send(user);
    body = JSON.parse(response.text);

    userId = body.id;

    response = await request(app)
      .get('/connect')
      .set('Authorization', credentials)
      .send();
    body = JSON.parse(response.text);

    token = body.token;
  });

  after(async () => {
    await redisClient.client.flushall('ASYNC');
    await dbClient.db.collections('users').deleteMany({});
    await dbClient.db.collections('files').deleteMany({});

    // delete folder where files are stored locally
    exec('rm -rf /tmp/files_manager', () => {});
  });

  describe('/files', () => {
    it('returns error', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app).post('/files').send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('returns error', async () => {
      expect.assertions(2);
      const fileInfo = {
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Missing name' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns error', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Missing type' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns error, wrong type', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'image',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Missing type' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns errorl, Missing data and not in folder', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Missing data' });
      expect(response.statusCode).to.equal(400);
    });

    it('creates file', async () => {
      expect.assertions(9);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);
      expect(body.parentId).to.equal(0);
      expect(body).to.have.property('id');
      expect(response.statusCode).to.equal(201);

      fileId = body.id;
      const file = await dbClient.db.collections('files').findOne({
        _id: ObjectId(body.id),
      });
      expect(file).to.exist;
      expect(file.localPath).to.exist;
    });

    it('created public file', async () => {
      expect.assertions(9);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: true,
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(true);
      expect(body.parentId).to.equal(0);
      expect(body).to.have.property('id');
      expect(response.statusCode).to.equal(201);

      const file = await dbClient.db.collections('files').findOne({
        _id: ObjectId(body.id),
      });
      expect(file).to.exist;
      expect(file.localPath).to.exist;
    });

    it('returns created folder', async () => {
      expect.assertions(9);
      const fileInfo = {
        name: 'images',
        type: 'folder',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);
      expect(body.parentId).to.equal(0);
      expect(body).to.have.property('id');
      expect(response.statusCode).to.equal(201);

      parentId = body.id;
      const folder = await dbClient.db.collections('files').findOne({
        _id: ObjectId(body.id),
      });
      expect(folder).to.exist;
      expect(folder.localPath).to.not.exist;
    });

    it('returns error on non existent parentId', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: '5f1e7cda04a394508232559d',
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Parent not found' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns error, parentId does not belong to a folder', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId: fileId,
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Parent is not a folder' });
      expect(response.statusCode).to.equal(400);
    });

    it('returns the created file with parentId', async () => {
      expect.assertions(8);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        parentId,
      };

      const response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);
      expect(body.parentId).to.equal(parentId);
      expect(body).to.have.property('id');

      expect(response.statusCode).to.equal(201);

      fileId = body.id;
      const file = await dbClient.db.collections('files').findOne({
        _id: ObjectId(body.id),
      });
      expect(file).to.exist;
    });
  });

  describe('/files/:id', () => {
    it('return error: unauthorized', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .get(`/files/${fileId}`)
        .set('Token-X', 123)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('return file', async () => {
      expect.assertions(6);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .get(`/files/${fileId}`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);
      expect(body.id).to.equal(fileId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);
      expect(body.parentId).to.equal(parentId);
      expect(response.statusCode).to.equal(200);
    });

    it('returns error: non-existent id', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
      };

      const response = await request(app)
        .get(`/files/${userId}`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('get /files', () => {
    before(async () => {
      await dbClient.db.collections('files').deleteMany({});
    });

    it('returns error: unauthorized on non-existent user', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/files')
        .set('X-Token', 498)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('returns empty list on non-existent parentId', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/files?parentId=5f1e881cc7ba06511e683b23')
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql([]);
      expect(response.statusCode).to.equal(200);
    });

    it('returns 20 files for root page', async () => {
      expect.assertions(2);
      for (let index = 0; index < 35; index += 1) {
        await dbClient.db.collections('files').insertOne({
          name: 'shore.txt',
          type: 'file',
          data: 'SGVsbG8gV2Vic3RhY2shCg==',
          isPublic: false,
          userId,
          parentId: 0,
        });
      }
      const response = await request(app)
        .get('/files')
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body.length).to.equal(20);
      expect(response.statusCode).to.equal(200);
    });

    it('return 15 files, second page', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/files?page=1')
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body.length).to.equal(15);
      expect(response.statusCode).to.equal(200);
    });

    it('return 0 files, third page', async () => {
      expect.assertions(2);
      const response = await request(app)
        .get('/files?page=2')
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body.length).to.equal(0);
      expect(response.statusCode).to.equal(200);

      await dbClient.db.collections('files').deleteMany({});
    });

    it('return 20 files, first page with parentId', async () => {
      expect.assertions(2);
      await dbClient.db.collections('files').insertOne({
        _id: ObjectId(parentId),
        name: 'text_files',
        type: 'folder',
        parentId: 0,
      });

      for (let index = 0; index < 35; index++) {
        await dbClient.db.collections('files').insertOne({
          name: 'shore.txt',
          type: 'file',
          data: 'SGVsbG8gV2Vic3RhY2shCg==',
          isPublic: false,
          userId,
          parentId: ObjectId(parentId),
        });
      }

      const response = await request(app)
        .get(`/files?parentId=${parentId}`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body.length).to.equal(20);
      expect(response.statusCode).to.equal(200);

      await dbClient.db.collections('files').deleteMany({});
    });
  });

  describe('/files/:id/publish', () => {
    it('returns error: Unauthorized', async () => {
      expect.assertions(2);
      const response = await request(app)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', 123)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('returns Not Found because no file linked to user found', async () => {
      expect.assertions(2);
      fileId = 'xA41x8w4fq3g';
      const response = await request(app)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });

    it('returns file with isPublic attributed changed to true', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: false,
      };

      let response;
      let body;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);

      fileId = body.id;

      response = await request(app)
        .put(`/files/${fileId}/publish`)
        .set('X-Token', token)
        .send();

      body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(true);
      expect(response.statusCode).to.equal(200);

      await dbClient.db.collections('files').deleteMany({});
    });
  });

  describe('/files/:id/unpublish', () => {
    it('returns error: Unauthorized', async () => {
      expect.assertions(2);
      const response = await request(app)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', 123)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Unauthorized' });
      expect(response.statusCode).to.equal(401);
    });

    it('returns Not Found', async () => {
      expect.assertions(2);
      fileId = 'xA41x8w4fq3g';
      const response = await request(app)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });

    it('returns file with isPublic attributed changed to true', async () => {
      expect.assertions(9);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: true,
      };

      let response;
      let body;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(true);

      fileId = body.id;

      response = await request(app)
        .put(`/files/${fileId}/unpublish`)
        .set('X-Token', token)
        .send();

      body = JSON.parse(response.text);

      expect(body.userId).to.equal(userId);
      expect(body.name).to.equal(fileInfo.name);
      expect(body.type).to.equal(fileInfo.type);
      expect(body.isPublic).to.equal(false);
      expect(response.statusCode).to.equal(200);

      await dbClient.db.collections('files').deleteMany({});
    });
  });

  describe('/files/:id/data', () => {
    it('returns error: Not Found', async () => {
      expect.assertions(2);
      fileId = 'ASxWCefcv654';
      const response = await request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });

    it('returns Error Not Found', async () => {
      expect.assertions(2);
      const file = await dbClient.db.collections('files').insertOne({
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: false,
        userId,
        parentId: 0,
      });

      fileId = file.insertedId.toString();
      const response = await request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', token)
        .send();

      const body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });

    it('returns error with folder', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'images',
        type: 'folder',
      };

      let body;
      let response;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      body = JSON.parse(response.text);
      fileId = body.id;

      response = await request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', token)
        .send();

      body = JSON.parse(response.text);

      expect(body).to.eql({ error: "A folder doesn't have content" });
      expect(response.statusCode).to.equal(400);
    });

    it('returns file data, it is not public and user is not owner', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: false,
      };

      let body;
      let response;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      body = JSON.parse(response.text);
      fileId = body.id;

      response = await request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', 'asdwwx89716')
        .send();

      body = JSON.parse(response.text);

      expect(body).to.eql({ error: 'Not found' });
      expect(response.statusCode).to.equal(404);
    });

    it('returns file data', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: false,
      };

      let response;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);
      fileId = body.id;

      response = await request(app)
        .get(`/files/${fileId}/data`)
        .set('X-Token', token)
        .send();
      expect(response.header['content-type']).to.be.equal(
        'text/plain; charset=utf-8',
      );
      expect(response.text).to.equal('Hello Webstack!\n');
      expect(response.statusCode).to.equal(200);
    });

    it('returns file data;', async () => {
      expect.assertions(2);
      const fileInfo = {
        name: 'shore.txt',
        type: 'file',
        data: 'SGVsbG8gV2Vic3RhY2shCg==',
        isPublic: true,
      };

      let response;

      response = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileInfo);

      const body = JSON.parse(response.text);
      fileId = body.id;

      response = await request(app).get(`/files/${fileId}/data`).send();

      expect(response.header['content-type']).to.be.equal(
        'text/plain; charset=utf-8',
      );
      expect(response.text).to.equal('Hello Webstack!\n');
      expect(response.statusCode).to.equal(200);
    });
  });
});
