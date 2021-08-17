const Tag = require('../models/tag.js')

module.exports = {

    async getTags (ctx) {
        const name = ctx.query.name || ''
        const limit = parseInt(ctx.query.limit) || 10
        const skip = parseInt(ctx.query.skip) || 0

        let tags
        if (name == '') {
            tags = await Tag.findTrendAndRandom({limit, skip})
        } else {
            tags = await Tag.find({name, limit, skip})
        }
        ctx.body = tags
    }
}