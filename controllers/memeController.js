const Meme = require('../models/meme.js')
const Tag = require('../models/tag.js')

module.exports = {

    async upload (ctx) {
        const userId = ctx.user
        const {image_url, description, tags} = ctx.request.body
        const meme = await Meme.add(userId, image_url, description, tags)
        await Tag.addMany(tags, meme._id)
        ctx.body = meme
    },

    async getTrending (ctx) {
        const userId = ctx.user
        let {skip} = ctx.query

        try {
            skip = parseInt(skip)
        } catch (e) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "skip" should be an integer.'}
            return
        }

        const memes = await Meme.findTrending(15, skip) // limit should not be too big
        ctx.body = memes
    },

    async vote (ctx) {
        const {meme_id, action} = ctx.request.body
        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.' }
            return
        }
        if (!action || (action !== 'upvote' && action !== 'downvote' && action !== 'clearvote')) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "action" should be "upvote", "downvote" or "clearvote". ' }
            return
        }
        if (action === 'upvote') await Meme.upvote(ctx.user, meme_id)
        else if (action === 'downvote') await Meme.downvote(ctx.user, meme_id)
        else if (action === 'clearvote') await Meme.clearvote(ctx.user, meme_id)
        ctx.body = {}
    },
}