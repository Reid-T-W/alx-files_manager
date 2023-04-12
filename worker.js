const imageThumbnail = require('image-thumbnail');
const { ObjectID } = require('mongodb');
const Queue = require('bull');
const fs = require('fs');
const dbClient = require('./utils/db');

const fileQueue = new Queue('fileQueue', 'redis://0.0.0.0:6379');
const userQueue = new Queue('userQueue', 'redis://0.0.0.0:6379');

// Processing the fileQueue
fileQueue.process(async (job, done) => {
  if (!('fileId' in job.data)) {
    throw new Error('Missing fileId');
  }
  if (!('userId' in job.data)) {
    throw new Error('Missing userId');
  }
  const files = await dbClient.db.collection('files');
  const file = await files.findOne({ _id: new ObjectID(job.data.fileId) });

  if (file.userId !== job.data.userId) {
    throw new Error('File not found');
  }

  // Generate image thumbnails
  const width500 = { width: 500 };
  const width250 = { width: 250 };
  const width100 = { width: 100 };

  try {
    const thumbnail500 = await imageThumbnail(`${file.localPath}`, width500);
    const thumbnail250 = await imageThumbnail(`${file.localPath}`, width250);
    const thumbnail100 = await imageThumbnail(`${file.localPath}`, width100);

    // Writing the files to disk
    fs.appendFile(`${file.localPath}_500`, thumbnail500, (err) => {
      console.log(err);
    });
    fs.appendFile(`${file.localPath}_250`, thumbnail250, (err) => {
      console.log(err);
    });
    fs.appendFile(`${file.localPath}_100`, thumbnail100, (err) => {
      console.log(err);
    });
    done();
  } catch (err) {
    console.error(err);
  }
});

// Processing the userQueue
userQueue.process(async (job, done) => {
  if (!('userId' in job.data)) {
    throw new Error('Missing userId');
  }
  const users = await dbClient.db.collection('users');
  const user = await users.findOne({ _id: new ObjectID(job.data.userId) });

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}`);
  done();
});
