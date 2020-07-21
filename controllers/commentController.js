const Comment = require('../models/comment.js')


module.exports = {

    async getComments (ctx) {
        const {meme_id, skip} = ctx.query
        const comments = await Comment.find({memeId: meme_id, limit: 15, skip})
        ctx.body = comments
    },

    async addComment(ctx) {
        const userId = ctx.user
        const {meme_id, content} = ctx.request.body
        const comment = await Comment.add(meme_id, userId, content)
        ctx.body = comment
    }
}