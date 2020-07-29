const Meme = require('../models/meme.js')
const Image = require('../models/image.js')
const Tag = require('../models/tag.js')
const User = require('../models/user.js')

module.exports = {

    async upload (ctx) {
        const userId = ctx.user
        const image_url = ctx.request.body.image_url 
        const description = ctx.request.body.description
        let tags = ctx.request.body.tags
        if (!image_url) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "image_url" should be given.'}
            return
        } else if (!description) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "description" should be given.'}
            return
        } else if (!tags) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "tags" should be an array of string or a string.'}
            return
        } else if (Array.isArray(tags) && !tags.every(i => (typeof i === "string"))) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "tags" should be an array of string or a string.'}
            return
        }
        if (!Array.isArray(tags)) {
            tags = [tags]
        }
        const meme = await Meme.add(userId, image_url, description, tags)
        await Image.increaseUsage(image_url, 1)
        await Tag.addMany(tags, meme._id)
        ctx.body = meme
    },

    async getTrending (ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        const memes = await Meme.findTrending({limit, skip}) // limit should not be too big
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

    async search (ctx) {
        const keyword = ctx.query.keyword || ''
        const memes = await Meme.find({keyword})
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
        ctx.response.status = 200
        ctx.body = null // server will return 204 No Content
    },

    async delete (ctx) {
        const memeId = ctx.request.body.meme_id
        if (!memeId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.' }
            return
        }
        await Meme.delete(memeId)
        ctx.status = 200
        ctx.body = null
    }
}