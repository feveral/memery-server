import { Collection, Db, MongoClient } from "mongodb";

const mongo = require('mongodb').MongoClient;
const config = require('../config.js');

class Database {

    private _dbName: string
    private _client: MongoClient
    private _db: Db

    constructor (dbName: string) {
        this.databaseName = dbName;
    }

    set databaseName (value: string) {
        this._dbName = value;
        this._client = undefined;
        this._db = undefined;
        this.getDB();
    }

    async getClient (): Promise<MongoClient> {
        if (this._client === undefined) {
            try {
                this._client = await mongo.connect(config.mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
                return this._client;
            } catch (error) {
                console.log(`connnected ${config.mongoUrl} error`);
                console.log(`error: ${error}`);
            }            
        }
        return this._client;
    }

    async getDB(): Promise<Db> {
        if (this._client === undefined || this._db === undefined) {
            try {
                this._client = await mongo.connect(config.mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
                this._db = await this._client.db(this._dbName);
                return this._db;
            } catch (error) {
                console.log(`connnected ${config.mongoUrl} error`);
                console.log(`error: ${error}`);
            }
        }
        return this._db;
    }
    
    async getCollection (collectionName: string): Promise<Collection> {
        if (this._client === undefined || this._db === undefined) {
            await this.getDB();
        }
        const collection = this._db.collection(collectionName);
        return collection;
    }

    async closeDB (): Promise<void> {
        await this._client.close();
        this._client = undefined;
        this._db = undefined;
    }
}

const database = new Database(config.mongoDatabaseName);
export default database;