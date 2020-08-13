const constants = require('../constants.js')
const Comment = require('../models/comment.js')
const User = require('../models/user.js')
const Notification = require('../models/notification.js')
const Meme = require('../models/meme.js')
const pushService = require('../libs/push-service.js')


module.exports = {

    async getComments (ctx) {
        const {meme_id} = ctx.query
        const limit = parseInt(ctx.query.limit) || 10
        const skip = parseInt(ctx.query.skip) || 0

        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "meme_id" should be given.'}
            return
        }

        const comments = await Comment.find({memeId: meme_id, limit, skip})
        const userIds = []
        comments.forEach(comment => {
            userIds.push(comment.user_id)
        })
        const users = await User.findByIds(userIds)
        for (let i = 0; i < comments.length; i++) {
            delete comments[i].meme_id
            for (let j = 0; j < users.length; j++) {
                if (users[j]._id.toString() === comments[i].user_id.toString()) {
                    comments[i].user_custom_id = users[j].custom_id
                    comments[i].user_name = users[j].name
                    comments[i].user_avatar_url = users[j].avatar_url
                    continue
                }
            }
        }
        ctx.body = comments
    },

    async addComment(ctx) {
        const userId = ctx.user
        const {meme_id, content} = ctx.request.body

        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.'}
            return
        } else if (!content) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "content" should be given.'}
            return
        }

        const comment = await Comment.add(meme_id, userId, content)
        const meme = await Meme.findOne(meme_id)
        await Notification.addReplyMeme(userId, meme, comment)
        const userReceiveNotification = await User.findOne(meme.user_id)
        if (userReceiveNotification.firebase_devices) {
            const result = await pushService.sendComment(constants.OS_ANDROID, userReceiveNotification.firebase_devices, content)
            if (result) {
                result.failTokens.forEach(t => {
                    User.removeFirebaseDeviceToken(meme.user_id, t)
                })
            }
        }
        ctx.body = comment
    },

    async deleteComment(ctx) {
        const userId = ctx.user
        const commentId = ctx.request.body.comment_id
        if (!commentId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "comment_id" should be given.'}
            return
        }
        await Comment.delete(userId, commentId)
        ctx.response.status = 200
        ctx.body = null
    }
}