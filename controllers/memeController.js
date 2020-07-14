const Meme = require('../models/meme.js')
const Tag = require('../models/tag.js')

module.exports = {

    async upload (ctx) {
        const userId = ctx.user
        const {image_url, description, tags} = ctx.request.body
        const meme = await Meme.add(userId, image_url, description, tags)
        await Tag.addMany(tags, meme.id)
        ctx.body = {status: true}
    }
}