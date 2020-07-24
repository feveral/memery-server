const Tag = require('../models/tag.js')

module.exports = {

    async getTags (ctx) {
        const name = ctx.query.name || ''
        const limit = parseInt(ctx.query.limit) || 10
        const skip = parseInt(ctx.query.skip) || 0

        const tags = await Tag.find({name, limit, skip})
        ctx.body = tags
    }
}