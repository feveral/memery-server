const shortUUID = require('short-uuid')
const database = require('../database/database.js')
const constants = require('../constants.js')

class Meme {

    constructor (id, userId, imageUrl, description, tags, upvote, downvote, upload_time) {
        this.id = id
        this.user_id = userId
        this.image_url = imageUrl
        this.description = description
        this.tags = tags
        this.upvote = upvote
        this.downvote = downvote
        this.upload_time = upload_time
    }

    static async add (userId, imageUrl, description, tags) {
        const id = shortUUID().generate()
        const meme = new Meme(id, userId, imageUrl, description, tags, 0, 0, new Date())
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.insertOne(meme)
        delete meme._id
        return meme
    }

    static async find ({id, userid, imageUrl, description, limit=15, skip=0}) {
        const filter = {}
        if (id) filter.id = id
        if (userid) filter.userid = userid
        if (imageUrl) filter.imageUrl = imageUrl
        if (description) filter.description = RegExp(`${description}`,'i')
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async findTrending (limit=15, skip=0) {
        const filter = {}
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter, {projection:{_id: 0}}).limit(limit).skip(skip).toArray()
        return result
    }

    static async upvote (memeId) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
    }

    static async downvote (memeId) {

    }
}

module.exports = Meme;