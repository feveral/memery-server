const Image = require('../models/image.js')

module.exports = {
    async upload (ctx) {
        const {ext} = ctx.query

        if (ext !== 'jpg' && ext !== 'png' && ext !== 'jpeg' && ext !== 'gif') {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "ext" should be "jpg" or "png" or "jpeg" or "gif".'}
            return
        }
        if (!ctx.file) {
            ctx.response.status = 400
            ctx.body = { message: 'image file should be in body form-data.'}
            return
        }
        const image = await Image.addToGCPCloudStorage(ctx.file.buffer, ext)
        ctx.body = image
    },

    async getImageInfo (ctx) {
        const image_id = ctx.params.id
        const image = await Image.findOne(image_id)
        if (image) ctx.body = image
        else {
            ctx.response.status = 400
            ctx.body = { message: 'image not found.'}
            return
        }
    },

    async deleteImage(ctx) {
        const image_id = ctx.params.id
        const image = await Image.findOne(image_id)
        if (!image) {
            ctx.response.status = 400
            ctx.body = { message: 'image not found.'}
            return
        } else if (image.usage > 0) {
            ctx.response.status = 400
            ctx.body = { message: 'this image is been used, cannot be deleted.'}
            return
        }
        // image.usage <= 0
        await Image.increaseUsage(image_id, -1)
        ctx.body = { message: 'this image deleted successfully.'}
    }
}