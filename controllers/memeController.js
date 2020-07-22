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

    async upvote (ctx) {
        ctx.body = {}
    },

    async downvote (ctx) {
        ctx.body = {}
    }
}