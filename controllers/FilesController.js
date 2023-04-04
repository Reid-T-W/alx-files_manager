const uuidv4 = require('uuid').v4;
const fs = require('fs');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { body } = req;

    // Checking if the required items are in body
    if (!body.name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!body.type) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!body.data && body.type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (body.parentId) {
      const { parentId } = body;
      const id = new ObjectID(parentId);
      const files = await dbClient.db.collection('files');
      const file = await files.findOne({ _id: id });

      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file && file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // If its a folder the following will be executed
    if (body.type === 'folder') {
      const files = await dbClient.db.collection('files');
      const file = await files.insertOne({
        userId,
        name: body.name,
        type: body.type,
        isPublic: body.isPublic || false,
        parentId: body.parentId || 0,
      });
      const savedFile = file.ops[0];
      return res.status(201).json({
        id: savedFile._id,
        userId: savedFile.userId,
        name: savedFile.name,
        type: savedFile.type,
        isPublic: savedFile.isPublic,
        parentId: savedFile.parentId,
      });
    }
    // If its a file the following will be executed
    if (body.type === 'file' || body.type === 'image') {
      const folderName = '/tmp/files_manager';
      if (!process.env.FOLDER_PATH) {
        if (body.parentId) {
          process.env.FOLDER_PATH = `${folderName}/${body.parentId}`;
        } else {
          process.env.FOLDER_PATH = folderName;
        }
      }
      try {
        if (!fs.existsSync(process.env.FOLDER_PATH)) {
          fs.mkdirSync(process.env.FOLDER_PATH);
        }
      } catch (err) {
        console.log(err);
      }
      // Creating the file
      const absoluteFilePath = `${process.env.FOLDER_PATH}/${uuidv4()}`;
      const decodedData = Buffer.from(body.data, 'base64').toString('ascii');
      fs.appendFile(absoluteFilePath, decodedData, (err) => {
        console.log(err);
      });

      const files = await dbClient.db.collection('files');
      const file = await files.insertOne({
        userId,
        name: body.name,
        type: body.type,
        isPublic: body.isPublic || false,
        parentId: body.parentId || 0,
        localPath: absoluteFilePath,
      });
      const savedFile = file.ops[0];
      return res.status(201).json({
        id: savedFile._id,
        userId: savedFile.userId,
        name: savedFile.name,
        type: savedFile.type,
        isPublic: savedFile.isPublic,
        parentId: savedFile.parentId,
      });
    }
    return null;
  }
}

module.exports = FilesController;
