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
        const type = ctx.query.type || 'search'
        const keyword = ctx.query.keyword || ''
        const skip = parseInt(ctx.query.skip) || 0
        let limit = parseInt(ctx.query.limit) || 20
        
        if (limit > 20) limit = 20
        let templates

        if (type === 'trending') {
            templates = await Template.findTrend({limit, skip})
        } else if (type === 'new') {
            templates = await Template.findNew({limit, skip})
        } else {
            templates = await Template.find({name: keyword, limit, skip, orderApplyNumber: true})
        }
        ctx.body = await templateAddImageInfo(templates)
    },
}