const fs = require('fs')
const shortUUID = require('short-uuid')
const config = require('../config.js')

module.exports = {
    async upload (ctx) {
        const imageId = shortUUID().generate()
        fs.writeFileSync(`images/${imageId}.jpg`, ctx.file.buffer)
        ctx.body = {image_url: `${config.serverBaseUrl}/${imageId}.jpg`}
    }
}