const Tag = require('../models/tag.js')

module.exports = {

    async getTags (ctx) {
        const {name} = ctx.request.body
        await Tag.find(name)
        ctx.body = {status: true}
    }
}