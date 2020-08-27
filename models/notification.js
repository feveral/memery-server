const database = require('../database/database.js')
const { COLLECTION_NOTIFICATION } = require('../constants.js')
const { ObjectID } = require('mongodb')
const Meme = require('./meme.js')

const LIKE_MEME = 'like_meme'
const LIKE_COMMENT = 'like_comment'
const LIKE_REPLY = 'like_reply'
const REPLY_MEME = 'reply_meme'
const REPLY_COMMENT = 'reply_comment'

class Notification {

    /**
     * @param {string} type type of notification
     * @param {string} user_id the user who received this notification
     * @param {string} action_user_id the user who triggered this notification, might be undefined in like case
     * @param {string} target 'meme' || 'comment'
     */
    constructor ({userId, actionUserId, type, memeId, commentId, parentCommentId, read, update_time}) {
        this.user_id = ObjectID(userId)
        this.type = type
        if (read) this.read = read
        if (update_time) this.update_time = update_time
        if (memeId) this.meme_id = ObjectID(memeId)
        if (commentId) this.comment_id = ObjectID(commentId)
        if (parentCommentId) this.parent_comment_id = ObjectID(parentCommentId)
        if (actionUserId) this.action_user_id = ObjectID(actionUserId)
    }

    static async find ({userId, limit=10, skip=0}) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        const notifications = await collection.find({user_id: ObjectID(userId)})
                .sort({create_at: -1}).limit(limit).skip(skip).toArray()
        return notifications
    }

    static async add (notification) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            notification,
            {'$set': {read: false, create_at: new Date()}},
            {upsert: true}
        )
    }

    static async addLikeMeme (meme) {
        const notification = new Notification({
            userId: meme.user_id,
            type: LIKE_MEME,
            memeId: meme._id
        })
        await Notification.add(notification)
    }

    static async addLikeComment (comment) {
        const notification = new Notification({
            userId: comment.user_id,
            type: LIKE_COMMENT,
            memeId: comment.meme_id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addLikeReplyComment (parentComment, comment) {
        const notification = new Notification({
            userId: comment.user_id,
            type: LIKE_REPLY,
            memeId: parentComment.meme_id,
            parentId: parentComment._id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addReplyMeme (actionUserId, meme, comment) {
        const notification = new Notification({
            userId: meme.user_id,
            type: REPLY_MEME,
            actionUserId,
            memeId: meme._id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addReplyComment (actionUserId, parentComment, comment) {
        const notification = new Notification({
            userId: parentComment.user_id,
            type: REPLY_COMMENT,
            actionUserId,
            memeId: parentComment.meme_id,
            commentId: comment._id,
            parentCommentId: parentComment._id
        })
        await Notification.add(notification)
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