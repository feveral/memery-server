const database = require('../database/database.js')
const constants = require('../constants')
const { ObjectID } = require('mongodb')
const Image = require('./image.js')

class Template {
    constructor (userId, name, imageId) {
        this.user_id = ObjectID(userId)
        this.name = name
        this.image_id = ObjectID(imageId)
        this.created_at = new Date()
        this.apply_meme_id = []
        this.apply_number = 0
        this.hide = false
    }

    static async add (userId, name, imageId) {
        const template = new Template(userId, name, imageId)
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        await collection.insertOne(template)
        return template
    }

    static async find ({name, limit=15, skip=0, orderApplyNumber=false}) {
        const filter = {}
        const order = {}
        if (name) {
            let regexString = ''
            for (let i = 0; i < name.length; i++) {
                regexString += `.*${name[i]}`
            }
            let regexFilter = {'$regex': `${regexString}.*`}
            filter['$or'] = [{name: regexFilter}]
        }
        if (orderApplyNumber) order.apply_number = -1
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter).sort(order).limit(limit).skip(skip).toArray()
    }

    static async findOne(id) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            return await collection.findOne({_id: ObjectID(id)})
        } catch (e) {
            // for ObjectId invalid
        }
    }

    static async addApplyMemeId (templateId, memeId) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            const result = await collection.updateOne({_id: ObjectID(templateId)}, {'$addToSet': {apply_meme_id: memeId}})
            if (result.result.nModified === 1) {
                await collection.updateOne({_id: ObjectID(templateId)}, {'$inc': {apply_number: 1}})
            }
        } catch (e) {
            // for ObjectId invalid
        }
    }

    static async removeApplyMemeId(templateId, memeId) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            const result = await collection.updateOne({_id: ObjectID(templateId)}, {'$pull': {apply_meme_id: memeId}})
            if (result.result.nModified === 1) {
                await collection.updateOne({_id: ObjectID(templateId)}, {'$inc': {apply_number: -1}})
            }
        } catch (e) {
            // for ObjectId invalid
        }
    }

    //TODO: need a trend query policy
    static async findTrend ({limit=15, skip=0, getApplyMemeIds=false}) {
        const filter = {}
        const projection = {apply_meme_ids: getApplyMemeIds}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter, {projection}).sort({apply_number: -1}).limit(limit).skip(skip).toArray()
    }

    //TODO: need a new query policy
    static async findNew ({limit=15, skip=0, getApplyMemeIds=false}) {
        const filter = {}
        const projection = {apply_meme_ids: getApplyMemeIds}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter, {projection})
                .sort({created_at: -1}) // TODO: should not that simple
                .limit(limit).skip(skip).toArray()
    }

    static async setHide (id, hide) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            if (hide) {
                await collection.updateOne({_id: ObjectID(id)}, {'$set': {hide: true}})
            } else {
                await collection.updateOne({_id: ObjectID(id)}, {'$set': {hide: false}})
            }
        } catch (e) {
            // for ObjectId invalid
        }
    }

    static async deleteOne ({id, userId}) {
        try {
            const filter = {}
            if (id) filter._id = ObjectID(id)
            if (userId) filter.user_id = ObjectID(userId)
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            const template = await collection.findOne(filter)
            if (template) {
                const result = await collection.deleteOne({_id: template._id})
                if (result.deletedCount === 1) {
                    await Image.increaseUsage(template.image_id, -1)
                }
                return result.deletedCount
            } else return 0
        } catch (e) {
            // for ObjectId invalid
            return 0
        }
    }
}

module.exports = Template