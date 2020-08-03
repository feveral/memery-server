const { ObjectID } = require("mongodb")
const database = require('../database/database.js')
const constants = require('../constants.js')
const Image = require('../models/image.js')

class Collect {

    constructor (userId, ownerUserId, imageId) {
        this.user_id = ObjectID(userId)
        this.owner_user_id = ObjectID(ownerUserId)
        this.image_id = ObjectID(imageId)
    }

    // TODO: should check is image exists
    static async add (userId, ownerUserId, imageId) {
        const collect = new Collect(userId, ownerUserId, imageId)
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        await collection.updateOne(collect, {"$setOnInsert": {created_at: new Date()}}, {upsert: true})
        await Image.increaseUsage(imageId, 1)
        return await collection.findOne(collect)
    }

    static async find ({userId, ownerUserId, limit, skip}) {
        const filter = {}
        if (userId) filter.user_id = ObjectID(userId)
        if (ownerUserId) filter.owner_user_id = ObjectID(ownerUserId)
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        if (limit) {
            return await collection.find(filter).limit(limit).skip(skip).toArray()
        } else {
            return await collection.find(filter).toArray()
        }
    }

    static async delete (userId, imageId) {
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        const result = await collection.deleteOne({user_id: ObjectID(userId), image_id: ObjectID(imageId)})
        if (result.result.n === 1) {
            await Image.increaseUsage(imageId, -1)
        }
    }

    static async count ({userId, ownerUserId}) {
        const filter = {}
        if (userId) filter.user_id = ObjectID(userId)
        if (ownerUserId) filter.owner_user_id = ObjectID(ownerUserId)
        const collection = await database.getCollection(constants.COLLECTION_COLLECT)
        return await collection.countDocuments(filter)
    }
}

module.exports = Collect