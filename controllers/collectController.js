const Collect = require('../models/collect.js')
const Image = require('../models/image.js')

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
        const limit = parseInt(ctx.query.limit) || 20
        const skip = parseInt(ctx.query.skip) || 0
        let collects = await Collect.find({userId, limit, skip})
        collects = await collectAddImageInfo(collects)
        ctx.body = collects
    },

    async addCollect(ctx) {
        const userId = ctx.user
        const imageId = ctx.request.body.image_id
        if (!imageId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "image_id" should be given. ' }
            return
        }
        await Collect.add(userId, imageId)
        ctx.response.status = 200
        ctx.body = null
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