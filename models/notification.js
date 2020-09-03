const database = require('../database/database.js')
const constants = require('../constants.js')
const { ObjectID } = require('mongodb')
const Meme = require('./meme.js')
const { NOTIFICATION_TYPE_LIKE_COMMENT, NOTIFICATION_TYPE_REPLY_COMMENT, NOTIFICATION_TYPE_REPLY_MEME, NOTIFICATION_TYPE_LIKE_REPLY, NOTIFICATION_TYPE_LIKE_MEME, COLLECTION_NOTIFICATION } = require('../constants.js')

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
            {'$set': {read: false, open: false, create_at: new Date()}},
            {upsert: true}
        )
    }

    static async addLikeMeme (meme) {
        const notification = new Notification({
            userId: meme.user_id,
            type: NOTIFICATION_TYPE_LIKE_MEME,
            memeId: meme._id
        })
        await Notification.add(notification)
    }

    static async addLikeComment (comment) {
        const notification = new Notification({
            userId: comment.user_id,
            type: NOTIFICATION_TYPE_LIKE_COMMENT,
            memeId: comment.meme_id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addLikeReplyComment (parentComment, comment) {
        const notification = new Notification({
            userId: comment.user_id,
            type: NOTIFICATION_TYPE_LIKE_REPLY,
            memeId: parentComment.meme_id,
            parentCommentId: parentComment._id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addReplyMeme (actionUserId, meme, comment) {
        const notification = new Notification({
            userId: meme.user_id,
            type: NOTIFICATION_TYPE_REPLY_MEME,
            actionUserId,
            memeId: meme._id,
            commentId: comment._id
        })
        await Notification.add(notification)
    }

    static async addReplyComment (actionUserId, parentComment, comment) {
        const notification = new Notification({
            userId: parentComment.user_id,
            type: NOTIFICATION_TYPE_REPLY_COMMENT,
            actionUserId,
            memeId: parentComment.meme_id,
            commentId: comment._id,
            parentCommentId: parentComment._id
        })
        await Notification.add(notification)
    }

    static async read (id, userId) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateOne(
            {_id: ObjectID(id), user_id: ObjectID(userId), read: false},
            {'$set': {read: true}}
        )
    }

    static async open (userId) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        await collection.updateMany(
            {user_id: ObjectID(userId), open: false},
            {'$set': {open: true}}
        )
    }

    static async findUnopenNumber (userId) {
        const collection = await database.getCollection(COLLECTION_NOTIFICATION)
        return await collection.countDocuments({user_id: ObjectID(userId), open: false})
    }

    static async delete ({type, userId, memeId, parentCommentId, commentId}) {
        try {
            const filter = {}
            if (type) filter.type = type
            if (userId) filter.user_id = ObjectID(userId)
            if (memeId) filter.meme_id = ObjectID(memeId)
            if (commentId) filter.comment_id = ObjectID(commentId)
            if (parentCommentId) filter.parent_comment_id = ObjectID(parentCommentId)
            const collection = await database.getCollection(COLLECTION_NOTIFICATION)
            await collection.deleteMany(filter)
        } catch (e) {
            // for invalid ObjectID
        }
    }
}

module.exports = Notification