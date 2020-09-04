const database = require('../database/database.js')
const constants = require('../constants')
const { ObjectID } = require('mongodb')

class Template {
    constructor (userId, name, imageId) {
        this.user_id = userId
        this.name = name
        this.image_id = imageId
        this.created_at = new Date()
        this.apply_meme_id = []
        this.apply_number = 0
    }

    static async add (userId, name, imageId) {
        const template = new Template(userId, name, imageId)
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        await collection.insertOne(template)
        return template
    }

    static async find ({name, limit=15, skip=0}) {
        const filter = {}
        if (name) filter.name = name
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter).limit(limit).skip(skip).toArray()
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
        return await collection.find(filter, {projection}).limit(limit).skip(skip).toArray()
    }

    //TODO: need a new query policy
    static async findNew ({limit=15, skip=0, getApplyMemeIds=false}) {
        const filter = {}
        const projection = {apply_meme_ids: getApplyMemeIds}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter, {projection})
                .sort({create_at: -1}) // TODO: should not that simple
                .limit(limit).skip(skip).toArray()
    }
}

module.exports = Template