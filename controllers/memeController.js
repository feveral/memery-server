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
        const skip = parseInt(ctx.query.skip) || 0
        const memes = await Meme.findTrending({limit: 8, skip}) // limit should not be too big
        const userIds = []
        memes.forEach(meme => {
            userIds.push(meme.user_id)
        })
        const users = await User.findByIds(userIds)
        for (let i = 0; i < memes.length; i++) {
            for (let j = 0; j < users.length; j++) {
                if (users[j]._id.toString() === memes[i].user_id.toString()) {
                    memes[i].user_custom_id = users[j].custom_id
                    memes[i].user_name = users[j].name
                    memes[i].user_avatar_url = users[j].avatar_url
                    continue
                }
            }
        }
        ctx.body = memes
    },

    async like (ctx) {
        const {meme_id, action} = ctx.request.body
        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.' }
            return
        }
        if (!action || (action !== 'like' && action !== 'dislike' && action !== 'clearlike')) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "action" should be "like", "dislike" or "clearlike". ' }
            return
        }
        if (action === 'like') await Meme.like(ctx.user, meme_id)
        else if (action === 'dislike') await Meme.dislike(ctx.user, meme_id)
        else if (action === 'clearlike') await Meme.clearlike(ctx.user, meme_id)
        ctx.response.status = 204
        ctx.body = null
    },
}