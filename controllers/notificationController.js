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
        if (n.comment_id) memeIds.push(n.comment_id)
    })
    const comments = await Comment.findByIds(commentIds)
    const users = await User.findByIds(actionUserIds)
    const memes = await Meme.findByIds(memeIds)
    memes.forEach(meme => {
        imageIds.push(meme.image_id)
    })
    const images = await Image.findByIds(imageIds)
    for (let i = 0; i < notifications.length; i++) {
        for (let j = 0; j < users.length; j++) {
            if (notifications[i].action_user_id && notifications[i].action_user_id.toString() === users[j]._id.toString()) {
                notifications[i].action_user_avatar_url = users[j].avatar_url
                notifications[i].action_user_name = users[j].name
                notifications[i].action_user_custom_id = users[j].custom_id
            }
        }
        for (let j = 0; j < memes.length; j++) {
            if (notifications[i].meme_id.toString() === memes[j]._id.toString()) {
                notifications[i].meme_like_number = memes[j].like
                for (let k = 0; k < images.length; k++) {
                    if (memes[j].image_id.toString() === images[k]._id.toString()) {
                        notifications[i].meme_image_url = images[k].url
                        notifications[i].meme_image_thumbnail_url = images[k].thumbnail_url
                    }
                }
            }
        }
        for (let j = 0; j < comments.length; j++) {
            notifications[i].comment_like_number = comments[j].like
        }
    }
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