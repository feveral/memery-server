const Template = require('../models/template.js')
const Image = require('../models/image.js')

module.exports = {
    
    async addTemplate (ctx) {
        const userId = ctx.user
        const name = ctx.request.body.name
        const imageId = ctx.request.body.image_id
        const image = await Image.findOne(imageId)
        if (!image || image.usage !== 0) {
            ctx.response.status = 400
            ctx.body = { messgae: 'image_id not valid or image usage not 0.'}
            return
        }
        const template = await Template.add(userId, name, imageId)
        await Image.increaseUsage(imageId, 1)
        ctx.body = template
    },

    async getTemplates (ctx) {
        const type = ctx.query.type || 'trending'
        let templates
        if (type === 'trending') {
            templates = await Template.findTrend({})
        } else {
            templates = await Template.findNew({})
        }
        ctx.body = templates
    },
}