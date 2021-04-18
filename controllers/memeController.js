const Meme = require('../models/meme.js')
const Image = require('../models/image.js')
const Tag = require('../models/tag.js')
const User = require('../models/user.js')
const Notification = require('../models/notification.js')
const Template = require('../models/template.js')
const Comment = require('../models/comment.js')
const constants = require('../constants.js')
const analytics = require('../libs/analytics.js')

async function memesAddUserAndImageInfo(memes) {
    const userIds = []
    const imageIds = []
    memes.forEach(meme => {
        userIds.push(meme.user_id)
        imageIds.push(meme.image_id)
    })
    const users = await User.findByIds(userIds)
    const images = await Image.findByIds(imageIds)
    for (let i = 0; i < memes.length; i++) {
        for (let j = 0; j < users.length; j++) {
            if (users[j]._id.toString() === memes[i].user_id.toString()) {
                memes[i].user_custom_id = users[j].custom_id
                memes[i].user_name = users[j].name
                memes[i].user_avatar_url = users[j].avatar_url
            }
        }
        for (let j = 0; j < images.length; j++) {
            if (images[j]._id.toString() === memes[i].image_id.toString()) {
                memes[i].image_url = images[j].url
                memes[i].image_thumbnail_url = images[j].thumbnail_url
            }
        }
    }
    return memes
}

module.exports = {

    async upload (ctx) {
        const userId = ctx.user
        const imageId = ctx.request.body.image_id 
        const description = ctx.request.body.description || ''
        const templateId = ctx.request.body.template_id
        let tags = ctx.request.body.tags
        let imageTexts = ctx.request.body.image_texts
        if (!imageId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "image_id" should be given.'}
            return
        } else if (!tags) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "tags" should be an array of string or a string.'}
            return
        }
        if (!Array.isArray(tags)) {
            tags = [tags]
        }
        tags = tags.filter(w => w !== '')
        if (tags.length == 0) {
            ctx.response.status = 400
            ctx.body = { message: 'tags should at least 1'}
            return
        }
        if (tags.length > 10) {
            ctx.response.status = 400
            ctx.body = { message: 'tags more then 10.'}
            return
        }
        if (imageTexts && !Array.isArray(imageTexts)) {
            imageTexts = [imageTexts]
        }
        const image = await Image.findOne(imageId)
        if (!image || image.usage !== 0) {
            ctx.response.status = 400
            ctx.body = { message: 'image_id not valid or image usage not 0.'}
            return
        }
        let meme
        if (templateId) {
            if (!(await Template.findOne(templateId))) {
                ctx.response.status = 400
                ctx.body = { message: 'template_id is invalid.'}
                return
            }
            if (imageTexts) meme = await Meme.add(userId, imageId, description, tags, templateId, imageTexts)
            else meme = await Meme.add(userId, imageId, description, tags, templateId)
        } else meme = await Meme.add(userId, imageId, description, tags)
        await Image.increaseUsage(imageId, 1)
        await Tag.addMany(tags, meme._id)
        await Template.addApplyMemeId(templateId, meme._id)
        meme = (await memesAddUserAndImageInfo([meme]))[0]
        ctx.body = meme
    },

    async getTrending (ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        let limit = parseInt(ctx.query.limit) || 20
        if (limit > 20) limit = 20
        let memes = await Meme.findTrending({limit, skip}) // limit should not be too big
        memes = await memesAddUserAndImageInfo(memes)
        analytics.increaseTrending()
        ctx.body = memes
    },

    async search (ctx) {
        const skip = parseInt(ctx.query.skip) || 0
        let limit = parseInt(ctx.query.limit) || 20
        if (limit > 20) limit = 20
        const keyword = ctx.query.keyword || ''
        let memes = await Meme.find({keyword, skip, limit, orderTimeDesc: true})
        memes = await memesAddUserAndImageInfo(memes)
        ctx.body = memes
    },

    async getUserMeme(ctx) {
        const userId = ctx.params.id
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        if (limit > 20) limit = 20
        let memes = await Meme.find({userId, skip, limit, orderTimeDesc: true})
        memes = await memesAddUserAndImageInfo(memes)
        ctx.body = memes
    },

    async getMemeById(ctx) {
        const memeId = ctx.params.id
        const meme = await Meme.findOne(memeId)
        if (meme) {
            const memes = await memesAddUserAndImageInfo([meme])
            ctx.body = memes[0]
        } else {
            ctx.response.status = 400
            ctx.body = { message: 'meme not found.' }
            return     
        }
    },

    async getMemesByTemplateId (ctx) {
        const templateId = ctx.params.id
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        const template = await Template.findOne(templateId, true)

        if (skip >= template.apply_meme_id.length) {
            ctx.body = []
            return
        }
        console.log("template apply memes length:", template.apply_meme_id.length)
        const memeIds = template.apply_meme_id.slice(skip, skip + limit)
        console.log("return length:", memeIds.length)
        let memes = await Meme.findByIds(template.apply_meme_id)
        memes = await memesAddUserAndImageInfo(memes)
        ctx.body = memes
    },

    async like (ctx) {
        const {meme_id, action} = ctx.request.body
        if (!meme_id) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.' }
            return
        }
        if (!action || (action !== 'like' && action !== 'dislike' && action !== 'clearlike')) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "action" should be "like", "dislike" or "clearlike". ' }
            return
        }
        const meme = await Meme.findOne(meme_id)
        if (!meme) {
            ctx.response.status = 400
            ctx.body = { message: 'meme_id not found' }
            return
        }
        if (action === 'like') {
            await Meme.like(ctx.user, meme_id)
            if (ctx.user !== meme.user_id.toString()) 
                await Notification.addLikeMeme(meme)
        }
        else if (action === 'dislike') {
            const result = await Meme.dislike(ctx.user, meme_id)
            if (meme.like - result === 0) await Notification.delete(
                {type: constants.NOTIFICATION_TYPE_LIKE_MEME, userId: meme.user_id, memeId: meme_id})
        }
        else if (action === 'clearlike') {
            const result = await Meme.clearlike(ctx.user, meme_id)
            if (meme.like - result === 0) await Notification.delete(
                {type: constants.NOTIFICATION_TYPE_LIKE_MEME, userId: meme.user_id, memeId: meme_id})
        }
        ctx.response.status = 200
        ctx.body = null // server will return 204 No Content
    },

    async delete (ctx) {
        const memeId = ctx.request.body.meme_id
        if (!memeId) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "meme_id" should be given.' }
            return
        }
        const meme = await Meme.findOne(memeId)
        if (meme) {
            await Meme.delete(meme._id)
            for(let i = 0; i < meme.tags.length; i++) {
                await Tag.deleteMemeId(meme.tags[i], meme._id)
            }
            await Notification.delete({memeId: meme._id})
            await Comment.deleteByMemeId(meme._id)
        }
        if (meme && meme.template_id) {
            await Template.removeApplyMemeId(meme.template_id, meme._id)
        }
        ctx.status = 200
        ctx.body = null // server will return 204 No Content
    }
}
