const { MongoClient } = require('mongodb');

class DBClient {
  constructor(host = '127.0.0.1', port = 27017, database = 'files_manager') {
    // Connection URL
    this.url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(this.url);
    this.client.connect().then(() => {
      this.db = this.client.db(database);
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.db.collection('users');
    this.findResult = await collection.find({}).toArray();
    return this.findResult.length;
  }

  async nbFiles() {
    const collection = this.db.collection('files');
    const findResult = await collection.find({}).toArray();
    return findResult.length;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
