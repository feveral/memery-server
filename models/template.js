const database = require('../database/database.js')
const constants = require('../constants')
const { ObjectID } = require('mongodb')
const Image = require('./image.js')

const templateAggregateFlow = [
    {
        $lookup: 
        {
            from: constants.COLLECTION_USER,
            localField: "user_id",
            foreignField: "_id",
            as: "userInfo"
        },
    },
    {
        $replaceRoot: { newRoot: { $mergeObjects: [ {u: { $arrayElemAt: [ "$userInfo", 0 ] }}, "$$ROOT" ] } }
    },
    { 
        $project: { userInfo: 0 }
    },
    { 
        $project: { 
            user_id: 1,
            name: 1,
            image_id: 1,
            created_at: 1,
            apply_meme_id: 1,
            apply_number: 1,
            hide: 1,
            userInfo: 1,
            user_name: '$u.name',
            user_custom_id: '$u.custom_id',
            user_avatar_url: '$u.avatar_url',
        }
    },
    {
        $lookup: 
        {
            from: constants.COLLECTION_IMAGE,
            localField: "image_id",
            foreignField: "_id",
            as: "imageInfo"
        },
    },
    {
        $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$imageInfo", 0 ] }, "$$ROOT" ] } }
    },
    { 
        $project: { imageInfo: 0 }
    },
    { 
        $project: { 
            user_id: 1,
            name: 1,
            image_id: 1,
            created_at: 1,
            apply_meme_id: 1,
            apply_number: 1,
            hide: 1,
            userInfo: 1,
            user_name: 1,
            user_custom_id: 1,
            user_avatar_url: 1,
            image_url: '$url',
            image_thumbnail_url: '$thumbnail_url',
        }
    }
]

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

    static async find ({name, limit=15, skip=0, orderApplyNumber=false, getApplyMemeId=false}) {
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
        const projection = {apply_meme_id: getApplyMemeId}
        return await collection.find(filter, {projection}).sort(order).limit(limit).skip(skip).toArray()
    }

    static async findOne(id, getApplyMemeId=false) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
            const aggregateFlow = []
            aggregateFlow.push({$match: {_id: ObjectID(id)}})
            if (!getApplyMemeId) {
                aggregateFlow.push({$project: { apply_meme_id: 0 }})
            }
            const templates = await collection.aggregate(
                aggregateFlow.concat(templateAggregateFlow)
            ).toArray()
            const template = templates.length > 0 ? templates[0] : null
            return template
        } catch (e) {
            // for ObjectId invalid
            return null
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
    static async findTrend ({limit=15, skip=0, getApplyMemeId=false}) {
        const filter = {}
        const projection = {apply_meme_id: getApplyMemeId}
        const collection = await database.getCollection(constants.COLLECTION_TEMPLATE)
        return await collection.find(filter, {projection}).sort({apply_number: -1}).limit(limit).skip(skip).toArray()
    }

    //TODO: need a new query policy
    static async findNew ({limit=15, skip=0, getApplyMemeId=false}) {
        const filter = {}
        const projection = {apply_meme_id: getApplyMemeId}
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