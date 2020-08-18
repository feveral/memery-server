const Template = require('../models/template.js')
const Image = require('../models/image.js')

module.exports = {
    
    async addTemplate (ctx) {
        const userId = ctx.user
        const name = ctx.request.body.name
        const imageId = ctx.request.body.image_id
        const isImageExist = await Image.isImageExist(imageId)
        if (!isImageExist) {
            ctx.response.status = 400
            ctx.body = {message: `the image id ${imageId} is not exist`}
            return
        }
        const template = await Template.add(userId, name, imageId)
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