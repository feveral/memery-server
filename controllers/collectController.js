const Collect = require('../models/collect.js')
const Image = require('../models/image.js')
const Meme = require('../models/meme.js')
const Notification = require('../models/notification.js')

async function collectAddImageInfo(collects) {
    const imageIds = []
    collects.forEach(collect => {
        imageIds.push(collect.image_id)
    })
    const images = await Image.findByIds(imageIds)
    for (let i = 0; i < collects.length; i++) {
        for (let j = 0; j < images.length; j++) {
            if (images[j]._id.toString() === collects[i].image_id.toString()) {
                collects[i].image_url = images[j].url
                collects[i].image_thumbnail_url = images[j].thumbnail_url
            }
        }
    }
    return collects
}

module.exports = {

    async getUserCollect(ctx) {
        const userId = ctx.user
        let limit = parseInt(ctx.query.limit) || 20
        const skip = parseInt(ctx.query.skip) || 0
        let collects
        collects = await Collect.find({userId, limit, skip})
        collects = await collectAddImageInfo(collects)
        ctx.body = collects
    },

    async addCollect(ctx) {
        const userId = ctx.user
        const memeId = ctx.request.body.meme_id
        if (!memeId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "memeId" should be given. ' }
            return
        }
        const meme = await Meme.findOne(memeId)
        let collect = await Collect.add(userId, meme.user_id, meme.image_id)
        collect = (await collectAddImageInfo([collect]))[0]
        ctx.body = collect
    },

    async deleteCollect (ctx) {
        const userId = ctx.user
        const imageId = ctx.request.body.image_id
        if (!imageId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "image_id" should be given. ' }
            return
        }
        await Collect.delete(userId, imageId)
        ctx.status = 200
        ctx.body = null
    }
}