const Meme = require('../models/meme.js')
const Image = require('../models/image.js')
const Tag = require('../models/tag.js')
const User = require('../models/user.js')

async function memesAddUserAndImageInfo(memes) {
    const userIds = []
    const imageIds = []
    memes.forEach(meme => {
        userIds.push(meme.user_id)
        imageIds.push(meme.image_id)
    })
    const users = await User.findByIds(userIds)
    const images = await Image.findByIds(imageIds)
    for (let i = 0; i < memes.length; i++) {
        for (let j = 0; j < users.length; j++) {
            if (users[j]._id.toString() === memes[i].user_id.toString()) {
                memes[i].user_custom_id = users[j].custom_id
                memes[i].user_name = users[j].name
                memes[i].user_avatar_url = users[j].avatar_url
            }
        }
        for (let j = 0; j < images.length; j++) {
            if (images[j]._id.toString() === memes[i].image_id.toString()) {
                memes[i].image_url = images[j].url
                memes[i].image_thumbnail_url = images[j].thumbnail_url
            }
        }
    }
    return memes
}

module.exports = {

    async upload (ctx) {
        const userId = ctx.user
        const image_id = ctx.request.body.image_id 
        const description = ctx.request.body.description || ''
        let tags = ctx.request.body.tags
        if (!image_id) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "image_id" should be given.'}
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
        let meme = await Meme.add(userId, image_id, description, tags)
        await Image.increaseUsage(image_id, 1)
        await Tag.addMany(tags, meme._id)
        meme = (await memesAddUserAndImageInfo([meme]))[0]
        ctx.body = meme
    },

    async getTrending (ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        let memes = await Meme.findTrending({limit, skip}) // limit should not be too big
        memes = await memesAddUserAndImageInfo(memes)
        ctx.body = memes
    },

    async search (ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        const keyword = ctx.query.keyword || ''
        let memes = await Meme.find({keyword, skip, limit})
        memes = await memesAddUserAndImageInfo(memes)
        ctx.body = memes
    },

    async getUserMeme(ctx) {
        const userId = ctx.user
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        let memes = await Meme.find({userId, skip, limit})
        memes = await memesAddUserAndImageInfo(memes)
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
        const meme = await Meme.findOne(memeId)
        await Meme.delete(memeId)
        for(let i = 0; i < meme.tags.length; i++) {
            await Tag.deleteMemeId(meme.tags[i], memeId)
        }
        ctx.status = 200
        ctx.body = null
    }
}
