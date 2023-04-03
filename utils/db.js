const { MongoClient } = require('mongodb');

class DBClient {
  constructor(host = '127.0.0.1', port = 27017, database = 'files_manager') {
    // Connection URL
    this.url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(this.url);
    this.client.connect();

    // // Database Name
    // const dbName = database;
    // try {
    //   this.client.connect();
    // } catch (err) {
    //   this.connected = false;
    // }

    this.db = this.client.db(dbName);
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.client.db.collection('users');
    this.findResult = await collection.find({}).toArray();
    return (this.findResult.length);
  }

  async nbFiles() {
    const collection = db.collection('files');
    const findResult = await collection.find({}).toArray();
    return (length(findResult));
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
