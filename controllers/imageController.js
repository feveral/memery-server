const Image = require('../models/image.js')

module.exports = {
    async upload (ctx) {
        const {ext} = ctx.query

        if (ext !== 'jpg' && ext !== 'png' && ext !== 'jpeg' && ext !== 'gif') {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter ext should be "jpg" or "png"'}
            return
        }
        if (!ctx.file) {
            ctx.response.status = 400
            ctx.body = { message: 'image file should be in body form-data.'}
            return
        }
        // const image = await Image.addToServer(ctx.file.buffer, ext)
        const image = await Image.addToAWSS3(ctx.file.buffer, ext)
        ctx.body = image
    },

    async getImageInfo (ctx) {
        const {image_id} = ctx.query
        if (!image_id) {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "image_id" should be given.'}
            return
        }
        const image = await Image.find({id: image_id})
        ctx.body = image
    },

    async deleteImage(ctx) {
        //TODO: This is only for admin user, must be handled carefully
    }
}