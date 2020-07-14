const mongo = require('mongodb').MongoClient;
const config = require('../config.js');

class Database {
    constructor(dbName) {
        this.databaseName = dbName;
    }

    set databaseName(value) {
        this._dbName = value;
        this._client = undefined;
        this._db = undefined;
        this.getDB();
    }

    async getDB() {
        if (this._client === undefined || this._db === undefined) {
            try {
                this._client = await mongo.connect(config.mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
                this._db = await this._client.db(this._dbName);
                return this._db;
            } catch (error) {
                console.log(`connnected ${config.mongoUrl} error`);
                console.log(`error: ${error}`)
            }
        }
        return this._db;
    }

    async getCollection(collectionName) {
        if (this._client === undefined || this._db === undefined) {
            await this.getDB();
        }
        const collection = this._db.collection(collectionName);
        return collection;
    }

    async closeDB() {
        await this._client.close();
        this._client = undefined;
        this._db = undefined;
    }
}

const database = new Database(config.mongoDatabaseName);

module.exports = database;