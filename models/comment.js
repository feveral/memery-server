const database = require('../database/database.js')
const constants = require('../constants.js')
const Meme = require('./meme.js')
const { ObjectId } = require('mongodb')
const ObjectID = require('mongodb').ObjectID

class Comment {

    /**
     * @param {string} userId user's object id string
     */
    constructor (memeId, userId, content) {
        this.meme_id = ObjectID(memeId)
        this.user_id = ObjectID(userId)
        this.created_at = new Date()
        this.content = content
    }

    //TODO: transaction
    static async add (memeId, userId, content) {
        const comment = new Comment(memeId, userId, content)
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        await collection.insertOne(comment)
        await Meme.increaseCommentNumber(memeId, 1)
        return comment
    }

    static async find ({memeId, limit=20, skip=0}) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const result = await collection.find({meme_id: ObjectID(memeId)}).sort({created_at: 1}).limit(limit).skip(skip).toArray()
        return result
    }

    static async delete (userId, commetId) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const comment = await collection.findOne({_id: ObjectID(commetId), user_id: ObjectID(userId)})
        const result = await collection.deleteOne({_id: ObjectID(commetId), user_id: ObjectID(userId)})
        if (result.result.n === 1) {
            await Meme.increaseCommentNumber(comment.meme_id, -1)
        }
    }
}

module.exports = Comment