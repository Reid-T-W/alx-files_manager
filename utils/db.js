const { MongoClient } = require('mongodb');

class DBClient {
    constructor(host = 'localhost', port = 27017, database = 'files_manager') {
        // Connection URL
        const url = `mongodb://${host}:${port}`;
        const client = new MongoClient(url);

        // Database Name
        const dbName = database;
        try {
            client.connect();
        } catch (err) {
            this.connected = false;
        }

        this.db = client.db(dbName);
    }

    isAlive() {
        return this.connected;
    }

    async nbUsers() {
        const collection = db.collection('users');
        const findResult = await collection.find({}).toArray();
        return(length(findResult))
    }

    async nbFiles() {
        const collection = db.collection('files');
        const findResult = await collection.find({}).toArray();
        return(length(findResult))
    }
}
const dbClient = new DBClient()
module.exports = dbClient;