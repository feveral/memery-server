const Tag = require('../models/tag.js')

module.exports = {

    async getTags (ctx) {
        const {name} = ctx.query
        const limit = parseInt(ctx.query.limit) || 10
        const skip = parseInt(ctx.query.skip) || 0

        if (!name) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "name" should be an given.'}
            return
        }

        const tags = await Tag.find({name, limit, skip})
        ctx.body = tags
    }
}