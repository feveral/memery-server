const User = require('../models/user.js')
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
        ctx.body = (await templateAddImageInfo([template]))[0]
    },

    async getTemplate(ctx)  {
        const id = ctx.params.id
        const template = await Template.findOne(id)
        if (template) ctx.body = template
        else {
            ctx.response.status = 400
            ctx.body = { message: 'template not found.'}
            return
        }
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

    // Critical: Admin account only
    async setTemplateHide (ctx) {
        const user = await User.findOne({id: ctx.user})
        if (user.level !== 'admin') {
            ctx.response.status = 403
            ctx.body = { messgae: 'forbidden: you have no permission to use this api.'}
            return
        }
        const id = ctx.params.id
        let hide = ctx.request.body.hide

        if (!hide) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "hide" should be given.'}
            return
        }
        if (!id) {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "id" should be given.'}
            return
        }
        if (typeof(hide) !== 'boolean' && hide !== 'true' && hide !== 'false') {
            ctx.response.status = 400
            ctx.body = { messgae: 'body parameter "hide" should be a boolean value.'}
            return
        }
        if (hide === 'true') hide = true
        if (hide === 'false') hide = false
        await Template.setHide(id, hide)
        ctx.status = 204
        ctx.body = null
    },

    async deleteTemplate(ctx) {
        const id = ctx.params.id
        const user = await User.findOne({id: ctx.user})
        const template = await Template.findOne(id);

        if (!template) {
            ctx.response.status = 400
            ctx.body = { messgae: 'template not found.'}
            return
        }

        if (user.level !== 'admin' && template.user_id.toString() !== user._id.toString()) {
            ctx.response.status = 403
            ctx.body = { messgae: 'permission denied: you have no permission to delete this template.'}
            return
        }

        if (user.level === 'admin') {
            await Template.deleteOne({id})
        } else {
            await Template.deleteOne({id, userId: ctx.user})
        }
        ctx.body = {message: 'delete template successfully'}
    }
}