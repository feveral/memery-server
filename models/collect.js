const { ObjectID } = require("mongodb")
const database = require('../database/database.js')
const constants = require('../constants.js')
const Image = require('../models/image.js')

class Collect {

    constructor (userId, imageUrl) {
        this.user_id = ObjectID(userId)
        this.image_url = imageUrl
    }

    // TODO: should check is image exists
    static async add (userId, imageUrl) {
        const collect = new Collect(userId, imageUrl)
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        await collection.updateOne(collect, {"$setOnInsert": {created_at: new Date()}}, {upsert: true})
        await Image.increaseUsage(imageUrl, 1)
    }

    static async find ({userId, limit=20, skip=0}) {
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        const collects = await collection.find({user_id: ObjectID(userId)}).limit(limit).skip(skip).toArray()
        return collects
    }

    static async delete (userId, imageUrl) {
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        const result = await collection.deleteOne({user_id: ObjectID(userId), image_url: imageUrl})
        if (result.result.n === 1) {
            await Image.increaseUsage(imageUrl, -1)
        }
    }
}

module.exports = Collect