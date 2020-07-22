const database = require('../database/database.js')
const constants = require('../constants.js')
const ObjectID = require('mongodb').ObjectID

class Comment {

    /**
     * @param {string} userId user's object id string
     */
    constructor (memeId, userId, createdAt, content) {
        this.meme_id = ObjectID(memeId)
        this.user_id = userId
        this.created_at = createdAt
        this.content = content
    }

    static async add (memeId, userId, content) {
        const comment = new Comment(memeId, userId, new Date(), content)
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        await collection.insertOne(comment)
        return comment
    }

    /**
     * 
     * @param {string} memeId object id string of meme_id
     */
    static async find ({memeId, limit=20, skip=0}) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const result = await collection.find({meme_id: ObjectID(memeId)}).sort({created_at: 1}).limit(limit).skip(skip).toArray()
        return result
    }
}

module.exports = Comment