const Video = require('../models/video.js')

module.exports = {
    async upload (ctx) {
        const {ext} = ctx.query

        if (ext !== 'mp4') {
            ctx.response.status = 400
            ctx.body = { message: 'query parameter "ext" should be "mp4".'}
            return
        }
        if (!ctx.file) {
            ctx.response.status = 400
            ctx.body = { message: 'image file should be in body form-data.'}
            return
        }
        const video = await Video.addToGCPCloudStorage(ctx.file.buffer, ext)
        ctx.body = video
    },

    async getVideos(ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        if (limit > 20) limit = 20
        const videos = await Video.find({limit, skip})
        ctx.body = videos
    }
}