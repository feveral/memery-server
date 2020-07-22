const Image = require('../models/image.js')

module.exports = {
    async upload (ctx) {
        const {ext} = ctx.query

        if (ext !== 'jpg' && ext !== 'png') {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter ext should be "jpg" or "png"'}
            return
        }
        if (!ctx.file) {
            ctx.response.status = 400
            ctx.body = { message: 'image file should be in body form-data.'}
            return
        }
        const image = await Image.addToServer(ctx.file.buffer, ext)
        ctx.body = image
    },

    async getImageInfo (ctx) {
        const {image_url} = ctx.query
        const image = await Image.find({url: image_url})
        ctx.body = image
    },

    async deleteImage(ctx) {
        //TODO:
    }
}