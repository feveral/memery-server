const Comment = require('../models/comment.js')


module.exports = {

    async getComments (ctx) {
        const {meme_id} = ctx.query
        let {limit=15, skip=0} = ctx.query

        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "meme_id" should be given.'}
            return
        }
        try {
            skip = parseInt(skip)
            limit = parseInt(limit)
        } catch (e) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "skip" and "limit" should be an integer.'}
            return
        }
        const comments = await Comment.find({memeId: meme_id, limit, skip})
        ctx.body = comments
    },

    async addComment(ctx) {
        const userId = ctx.user
        const {meme_id, content} = ctx.request.body

        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.'}
        } else if (!content) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "content" should be given.'}
        }

        const comment = await Comment.add(meme_id, userId, content)
        ctx.body = comment
    }
}