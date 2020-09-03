const Notification = require("../models/notification")
const Meme = require("../models/meme")
const Image = require("../models/image")
const User = require("../models/user")
const Comment = require("../models/comment")

async function notificationsAddInfo(notifications) {
    const actionUserIds = []
    const memeIds = []
    const imageIds = []
    const commentIds = []
    const childCommentIds = []
    const parentCommentIds = []
    notifications.forEach(n => {
        if (n.action_user_id) actionUserIds.push(n.action_user_id)
        if (n.meme_id) memeIds.push(n.meme_id)
        if (!n.parent_comment_id && n.comment_id) commentIds.push(n.comment_id)
        if (n.parent_comment_id && n.comment_id) {
            parentCommentIds.push(n.parent_comment_id)
            commentIds.push(n.parent_comment_id)
            childCommentIds.push(n.comment_id)
        }
    })
    const comments = await Comment.findByIds(commentIds)
    const childComments = await Comment.findChildComments(parentCommentIds, childCommentIds)
    const users = await User.findByIds(actionUserIds)
    const memes = await Meme.findByIds(memeIds)
    memes.forEach(meme => {
        imageIds.push(meme.image_id)
    })
    const images = await Image.findByIds(imageIds)
    notifications.forEach(notification => {
        users.forEach(user => {
            if (notification.action_user_id && notification.action_user_id.toString() === user._id.toString()) {
                notification.action_user_avatar_url = user.avatar_url
                notification.action_user_name = user.name
                notification.action_user_custom_id = user.custom_id
            }
        })
        memes.forEach(meme => {
            if (notification.meme_id.toString() === meme._id.toString()) {
                notification.meme_like_number = meme.like
                images.forEach(image => {
                    if (meme.image_id.toString() === image._id.toString()) {
                        notification.meme_image_url = image.url
                        notification.meme_image_thumbnail_url = image.thumbnail_url
                    }
                })
            }
        })
        comments.forEach(comment => {
            if (notification.parent_comment_id
                && notification.parent_comment_id.toString() === comment._id.toString()) {
                notification.parent_comment_content = comment.content
            } else if (notification.comment_id
                && notification.comment_id.toString() === comment._id.toString()) {
                notification.comment_content = comment.content
                notification.comment_like_number = comment.like
            }
        })
        childComments.forEach(comment => {
            if (notification.comment_id
                && notification.parent_comment_id
                && notification.comment_id.toString() === comment._id.toString()) {
                notification.comment_content = comment.content
                notification.comment_like_number = comment.like
            }
        })
    })
    return notifications
}


module.exports = {
    async getNotifications (ctx) {
        const userId = ctx.user
        const skip = parseInt(ctx.query.skip) || 0
        let limit = parseInt(ctx.query.limit) || 10
        if (limit > 20) limit = 20
        let notifications = await Notification.find({userId, limit, skip})
        notifications = await notificationsAddInfo(notifications)
        ctx.body = notifications
    },

    async readNotification (ctx) {
        const userId = ctx.user
        const id = ctx.body.notification_id
        if (!id) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "notification_id" should be given.'}
            return
        }
        await Notification.read(id, userId)
        ctx.response.status = 200
        ctx.body = null
    },

    async openNotification (ctx) {
        const userId = ctx.user
        await Notification.open(userId)
        ctx.response.status = 200
        ctx.body = null
    }, 

    async getUnopenNotificationCount (ctx) {
        const userId = ctx.user
        const unopenNumber = await Notification.findUnopenNumber(userId)
        ctx.body = {unopen_number: unopenNumber}
    }
}