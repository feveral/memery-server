const Meme = require('../models/meme.js')
const Tag = require('../models/tag.js')
const User = require('../models/user.js')

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
        const skip = parseInt(ctx.query.skip) || 0

        const memes = await Meme.findTrending(15, skip) // limit should not be too big
        const userIds = []
        memes.forEach(meme => {
            userIds.push(meme.user_id)
        })
        const users = await User.findByIds(userIds)
        for (let i = 0; i < memes.length; i++) {
            for (let j = 0; j < users.length; j++) {
                if (users[j]._id.toString() === memes[i].user_id.toString()) {
                    memes[i].user_custom_id = users[j].custom_id
                    continue
                }
            }
        }
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
        ctx.response.status = 204
        ctx.body = null
    },
}