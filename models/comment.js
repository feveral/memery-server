const database = require('../database/database.js')
const constants = require('../constants.js')
const Meme = require('./meme.js')
const User = require('./user.js')
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
        this.like = 0
    }

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

    static async findOne (id) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            return await collection.findOne({_id: ObjectID(id)})
        } catch (e) {
            return null
        }
    }

    static async delete (userId, commentId) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const comment = await collection.findOne({_id: ObjectID(commentId), user_id: ObjectID(userId)})
        const result = await collection.deleteOne({_id: ObjectID(commentId), user_id: ObjectID(userId)})
        if (result.result.n === 1) {
            await Meme.increaseCommentNumber(comment.meme_id, -1)
        }
    }

    static async like(userId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$addToSet':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne({_id: ObjectID(commentId)}, {'$inc': {like: 1}})
        }
    }

    static async clearlike(userId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne({_id: ObjectID(commentId)}, {'$inc': {like: -1}})
        }
    }

}

module.exports = Comment