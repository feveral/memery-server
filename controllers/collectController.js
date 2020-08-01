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