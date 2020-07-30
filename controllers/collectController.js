const Collect = require('../models/collect.js')


module.exports = {

    async getUserCollect(ctx) {
        const userId = ctx.user
        const limit = parseInt(ctx.query.limit) || 20
        const skip = parseInt(ctx.query.skip) || 0
        const collects = await Collect.find({userId, limit, skip})
        ctx.body = collects
    },

    async addCollect(ctx) {
        const userId = ctx.user
        const imageUrl = ctx.request.body.image_url
        if (!imageUrl) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "image_url" should be given. ' }
            return
        }
        await Collect.add(userId, imageUrl)
        ctx.response.status = 200
        ctx.body = null
    },

    async deleteCollect (ctx) {
        const userId = ctx.user
        const imageUrl = ctx.request.body.image_url
        if (!imageUrl) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "image_url" should be given. ' }
            return
        }
        await Collect.delete(userId, imageUrl)
        ctx.status = 200
        ctx.body = null
    }
}