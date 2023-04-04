const { MongoClient } = require('mongodb');

class DBClient {
  constructor(host = '127.0.0.1', port = 27017, database = 'files_manager') {
    // Connection URL
    // this.url = `mongodb://${host}:${port}`;
    this.url = 'mongodb+srv://eniolatoluwalase78:BNNkBSdEdFRCCux9@files-manager.qmler3v.mongodb.net/?retryWrites=true&w=majority';
    this.client = new MongoClient(this.url);
    this.client.connect().then(() => {
      // this.db = this.client.db(database);
      this.db = this.client.db('files-manager');
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.db.collection('users');
    try {
      this.findResult = await collection.find({}).toArray();
      return this.findResult.length;
    } catch (err) {
      return 0;
    }
  }

  async nbFiles() {
    const collection = this.db.collection('files');
    try {
      const findResult = await collection.find({}).toArray();
      return findResult.length;
    } catch (err) {
      return 0;
    }
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
