const database = require('../database/database.js')
const constants = require('../constants')

class Template {
    constructor (userId, name, imageId) {
        this.user_id = userId
        this.name = name
        this.image_id = imageId
        this.create_at = new Date()
        this.apply_meme_id = []
    }

    static async add(userId, name, imageId) {
        const template = new Template(userId, name, imageId)
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        await collection.insertOne(template)
        return template
    }

    static async find({name, limit=15, skip=0}) {
        const filter = {}
        if (name) filter.name = name
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter).limit(limit).skip(skip).toArray()
    }

    //TODO: need a trend query policy
    static async findTrend({limit=15, skip=0}) {
        const filter = {}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter).limit(limit).skip(skip).toArray()
    }

    //TODO: need a new query policy
    static async findNew({limit=15, skip=0}) {
        const filter = {}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter).limit(limit).skip(skip).toArray()
    }
}

module.exports = Template