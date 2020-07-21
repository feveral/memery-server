const fs = require('fs')
const shortUUID = require('short-uuid')
const config = require('../config.js')

module.exports = {
    async upload (ctx) {
        const {ext} = ctx.query

        if (ext !== 'jpg' && ext !== 'png') {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter ext should be "jpg" or "png"'}
            return
        }

        const imageId = shortUUID().generate()
        fs.writeFileSync(`images/${imageId}.${ext}`, ctx.file.buffer)
        ctx.body = {image_url: `${config.serverBaseUrl}/${imageId}.${ext}`}
    }
}