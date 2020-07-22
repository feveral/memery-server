const Tag = require('../models/tag.js')

module.exports = {

    async getTags (ctx) {
        const {name, limit=8, skip=0} = ctx.query
        if (!name) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "name" should be an integer.'}
            return
        }
        const tags = await Tag.find({name, limit, skip})
        ctx.body = tags
    }
}