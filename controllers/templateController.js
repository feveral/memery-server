const Template = require('../models/template.js')
const Image = require('../models/image.js')

async function templateAddImageInfo(templates) {
    const imageIds = []
    templates.forEach(template => {
        imageIds.push(template.image_id)
    })
    const images = await Image.findByIds(imageIds)
    templates.forEach(template => {
        images.forEach(image => {
            if (image._id.toString() === template.image_id.toString()) {
                template.image_url = image.url
                template.image_thumbnail_url = image.thumbnail_url
            }
        });
    })
    return templates
}


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
        ctx.body = await templateAddImageInfo(templates)
    },
}