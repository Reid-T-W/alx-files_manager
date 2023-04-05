const imageThumbnail = require('image-thumbnail');
const { ObjectID } = require('mongodb');
const dbClient = require('./utils/db');


module.exports = async function (job) {
//const imageProcess = async (job, done) => {
  console.log("in worker");
  console.log(job);
  console.log(job.userId);
  if (!('fileId' in job.data)) {
    console.log("in first error");
    throw new Error('Missing fileId');
  }
  if (!('userId' in job.data)) {
    console.log("in second error");
    throw new Error('Missing fileId');
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
    console.log("creating");
    const thumbnail500 = await imageThumbnail(`${file.localPath}_500`, width500);
    const thumbnail250 = await imageThumbnail(`${file.localPath}_250`, width250);
    const thumbnail100 = await imageThumbnail(`${file.localPath}_100`, width100);
  } catch (err) {
    console.error(err);
  }
};
