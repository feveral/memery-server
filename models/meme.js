const database = require('../database/database.js')
const constants = require('../constants.js')
const ObjectID = require('mongodb').ObjectID

class Meme {
    /**
     * @param {string} userId user's object id string
     */
    constructor (userId, imageUrl, description, tags, upvote, downvote, upload_time) {
        this.user_id = ObjectID(userId)
        this.image_url = imageUrl
        this.description = description
        this.tags = tags
        this.upvote = upvote
        this.downvote = downvote
        this.upload_time = upload_time
    }

    static async add (userId, imageUrl, description, tags) {
        const meme = new Meme(userId, imageUrl, description, tags, 0, 0, new Date())
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.insertOne(meme)
        return meme
    }

    static async find ({id, userId, imageUrl, description, limit=15, skip=0}) {
        const filter = {}
        if (id) filter._id = id
        if (userId) filter.userid = userId
        if (imageUrl) filter.imageUrl = imageUrl
        if (description) filter.description = RegExp(`${description}`,'i')
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async findTrending (limit=15, skip=0) {
        const filter = {}
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async upvote (memeId) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.updateOne({}, {})
    }

    static async downvote (memeId) {

    }
}

module.exports = Meme;