const constants = require('../constants.js')
const Comment = require('../models/comment.js')
const User = require('../models/user.js')
const Notification = require('../models/notification.js')
const Meme = require('../models/meme.js')
const pushService = require('../libs/push-service.js')


async function commentAddUserInfo(comments) {
    const userIds = []
    comments.forEach(comment => {
        userIds.push(comment.user_id)
    })
    const users = await User.findByIds(userIds)
    comments.forEach(comment => {
        users.forEach(user => {
            if (user._id.toString() === comment.user_id.toString()) {
                comment.user_custom_id = user.custom_id
                comment.user_name = user.name
                comment.user_avatar_url = user.avatar_url
            }
        })
    })
    return comments
}


module.exports = {

    async getCommentById (ctx) {
        const commentId = ctx.params.id
        const comment = await Comment.findOne({id: commentId})
        if (comment) {
            const comments = await commentAddUserInfo([comment])
            ctx.body = comments[0]
        } else {
            ctx.response.status = 400
            ctx.body = { message: 'comment not found.' }
            return     
        }
    },

    async getComments (ctx) {
        const {meme_id} = ctx.query
        const limit = parseInt(ctx.query.limit) || 10
        const skip = parseInt(ctx.query.skip) || 0

        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "meme_id" should be given.'}
            return
        }
        let comments = await Comment.findByOrder({memeId: meme_id, limit, skip})
        comments = await commentAddUserInfo(comments)
        ctx.body = comments
    },

    async getCommentReplyById (ctx) {
        const parentCommentId = ctx.query.parent_comment_id
        const commentId = ctx.params.id
        if (!parentCommentId) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "parent_comment_id" should be given.'}
            return
        }
        const comment = await Comment.findReplyCommentById(parentCommentId, commentId)
        if (!comment) {
            ctx.response.status = 400
            ctx.body = { message: 'comment not exists.'}
            return
        } else {
            ctx.body = comment
        }
    },

    async getCommentReply (ctx) {
        const parentCommentId = ctx.query.parent_comment_id
        const limit = parseInt(ctx.query.limit) || 3
        const skip = parseInt(ctx.query.skip) || 0
        const comment = await Comment.findOne({id: parentCommentId, limit, skip})
        if (!comment) {
            ctx.response.status = 400
            ctx.body = { message: 'parent_comment_id is invalid.'}
            return
        } else if (!comment.children) {
            ctx.body = []
            return
        }
        let comments = comment.children
        comments = await commentAddUserInfo(comments)
        if (!comments) {
            ctx.response.status = 400
            ctx.body = { message: 'meme_id or parent_comment_id is invalid.'}
            return
        }
        ctx.body = comments
    },

    async addComment (ctx) {
        const userId = ctx.user
        const content = ctx.request.body.content
        const memeId = ctx.request.body.meme_id
        const parentCommentId = ctx.request.body.parent_comment_id

        if (!memeId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.'}
            return
        } else if (!content) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "content" should be given.'}
            return
        }
        let comment
        if (parentCommentId) {
            comment = await Comment.addChild(parentCommentId, memeId, userId, content)
            if (!comment) {
                ctx.response.status = 400
                ctx.body = { message: "parent_comment_id or meme_id invalid."}
                return
            }
            const parentComment = await Comment.findOne({id: parentCommentId})
            await Notification.addReplyComment(userId, parentComment, comment)
            const userReceiveNotification = await User.findOne({id: parentComment.user_id})
            if (userReceiveNotification.firebase_devices) {
                const result = await pushService.sendReplayComment(userReceiveNotification.firebase_devices, content)
                if (result) {
                    result.failTokens.forEach(t => {
                        User.removeFirebaseDeviceToken(meme.user_id, t)
                    })
                }
            }
        } else {
            comment = await Comment.add(memeId, userId, content)
            if (!comment) {
                ctx.response.status = 400
                ctx.body = { message: "meme_id invalid."}
                return
            }
            const meme = await Meme.findOne(memeId)
            await Notification.addReplyMeme(userId, meme, comment)
            const userReceiveNotification = await User.findOne({id: meme.user_id})
            if (userReceiveNotification.firebase_devices) {
                const result = await pushService.sendComment(constants.OS_ANDROID, userReceiveNotification.firebase_devices, content)
                if (result) {
                    result.failTokens.forEach(t => {
                        User.removeFirebaseDeviceToken(meme.user_id, t)
                    })
                }
            }
        }
        const user = await User.findOne({id: userId})
        comment.user_custom_id = user.custom_id
        comment.user_name = user.name
        comment.user_avatar_url = user.avatar_url
        ctx.body = comment
    },

    //TODO: need to support child 
    async likeComment(ctx) {
        const userId = ctx.user
        const commentId = ctx.request.body.comment_id
        const action = ctx.request.body.action
        const parentCommentId = ctx.request.body.parent_comment_id

        if (!commentId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "comment_id" should be given.'}
            return
        }
        if (!action || (action!=='like' && action !== 'clearlike')) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "action" should be "like" or "clearlike".'}
            return
        }
        if (!parentCommentId) {
            if (action === 'like') {
                const comment = await Comment.findOne({id: commentId})
                if (!comment) {
                    ctx.response.status = 400
                    ctx.body = { message: 'comment_id not found.'}
                    return
                }
                await Comment.like(userId, commentId)
                await Notification.addLikeComment(comment)
            } else if (action === 'clearlike') {
                await Comment.clearlike(userId, commentId)
            }
        } else {
            if (action === 'like') {
                // const comment = await Comment.findOne(commentId)
                await Comment.likeReply(userId, parentCommentId, commentId)
                // await Notification.addLikeComment(comment)
            } else if (action === 'clearlike') {
                await Comment.clearLikeReply(userId, parentCommentId, commentId)
            }
        }
        ctx.response.status = 200
        ctx.body = null
    },

    // TODO: Need to support reply comment
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