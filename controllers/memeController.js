const Meme = require('../models/meme.js')
const Tag = require('../models/tag.js')

module.exports = {


    async upload (ctx) {

        const user_id = 'example_userid@gmail.com'
        const {image_url, description, tags} = ctx.request.body
        const meme = await Meme.add(user_id, image_url, description, tags)
        await Tag.addMany(tags, meme.id)
        ctx.body = {status: true}
    }
}