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
    notifications.forEach(n => {
        if (n.action_user_id) actionUserIds.push(n.action_user_id)
        if (n.meme_id) memeIds.push(n.meme_id)
        if (!n.parent_comment_id && n.comment_id) commentIds.push(n.comment_id)
        if (n.parent_comment_id && n.comment_id) commentIds.push(n.parent_comment_id)
    })
    const comments = await Comment.findByIds(commentIds)
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
            }
        });
    })
    return notifications
}


module.exports = {
    async getNotifications(ctx) {
        const userId = ctx.user
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        let notifications = await Notification.find({userId, limit, skip})
        notifications = await notificationsAddInfo(notifications)
        ctx.body = notifications
    },

    async readNotifications(ctx) {
        const userId = ctx.user
        await Notification.read(userId)
        ctx.response.status = 200
        ctx.body = null
    }
}