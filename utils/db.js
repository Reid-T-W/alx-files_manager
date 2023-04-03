const { MongoClient } = require('mongodb');

class DBClient {
  constructor(host = 'localhost', port = 27017, database = 'files_manager') {
    // Connection URL
    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url);
    this.client.connect();
    // Database Name
    // const dbName = database;
    // try {
    //  client.connect();
    // } catch (err) {
    //  this.connected = false;
    //}

    // this.db = client.db(dbName);
  }

  isAlive() {
    const connectPromise = new Promise((resolve, reject) => {
      try {
	console.log("In try")
        this.client.connect();
        resolve()
      } catch(err) {
        reject(err)
      }
    })
    connectPromise.then(() => {
      console.log("In here")
      this.connected = true
      return Promise.resolve(this.connected);
    }).catch((err) => {
      console.log("In catch")
      this.connected = false
      return Promise.reject(this.connected);
    })
    }
  

  async nbUsers() {
    const collection = db.collection('users');
    const findResult = await collection.find({}).toArray();
    return (findResult.length);
  }

  async nbFiles() {
    const collection = db.collection('files');
    const findResult = await collection.find({}).toArray();
    return (findResult.length);
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
