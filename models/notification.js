const database = require('../database/database.js')
const { COLLECTION_NOTIFICATION } = require('../constants.js')
const { ObjectID } = require('mongodb')
const Meme = require('./meme.js')

const LIKE_MEME = 'like_meme'
const LIKE_COMMENT = 'like_comment'
const REPLY_MEME = 'reply_meme'
const REPLY_COMMENT = 'reply_comment'
const COLLECT_MEME = 'collect_meme'

class Notification {

    /**
     * @param {string} type type of notification
     * @param {string} user_id the user who received this notification
     * @param {string} action_user_id the user who triggered this notification, might be undefined in like case
     * @param {string} target 'meme' || 'comment'
     */
    constructor ({userId, actionUserId, type, memeId, commentId, read, update_time}) {
        this.user_id = ObjectID(userId)
        this.type = type
        if (read) this.read = read
        if (update_time) this.update_time = update_time
        if (memeId) this.meme_id = ObjectID(memeId)
        if (commentId) this.comment_id = ObjectID(commentId)
        if (actionUserId) this.action_user_id = ObjectID(actionUserId)
    }

    static async find ({userId, limit=10, skip=0}) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        const notifications = await collection.find({user_id: ObjectID(userId)})
                .sort({update_time: -1}).limit(limit).skip(skip).toArray()
        return notifications
    }

    static async addLikeMeme (meme) {
        const notification = new Notification({userId: meme.user_id, type: LIKE_MEME, memeId: meme._id})
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, update_time: new Date()}},
            {upsert: true}
        )
    }

    static async addLikeComment (comment) {
        const notification = new Notification({
            userId: comment.user_id, type: LIKE_COMMENT, commentId: comment._id})
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, update_time: new Date()}},
            {upsert: true}
        )
    }

    static async addReplyMeme (actionUserId, meme) {
        const notification = new Notification({
            userId: meme.user_id, type: REPLY_MEME,
            actionUserId, memeId: meme._id
        })
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, update_time: new Date()}},
            {upsert: true}
        )
    }

    static async addReplyComment (actionUserId, comment) {
        const notification = new Notification({
            userId: comment.user_id, type: REPLY_COMMENT,
            actionUserId, commentId: comment._id
        })
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, update_time: new Date()}},
            {upsert: true}
        )
    }

    static async addCollectMeme (meme) {
        const notification = new Notification({userId: meme.user_id, type: COLLECT_MEME, memeId: meme._id})
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, update_time: new Date()}},
            {upsert: true}
        )
    }

    static async read (userId) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateMany(
            {user_id: ObjectID(userId), read: false},
            {'$set': {read: true}}
        )
    }
}

module.exports = Notification