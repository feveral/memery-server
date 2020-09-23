const database = require('../database/database.js')
const constants = require('../constants.js')
const utility = require('../libs/utility')
const ObjectID = require('mongodb').ObjectID
const Image = require('./image.js')

class Meme {
    /**
     * @param {string} userId user's object id string
     */
    constructor (userId, imageId, description, tags) {
        this.user_id = ObjectID(userId)
        this.image_id = ObjectID(imageId)
        this.description = description
        this.tags = tags
        this.like = 0
        this.dislike = 0
        this.upload_time = new Date()
        this.comment_number = 0
    }

    /**
     * 
     * @param {*} userId 
     * @param {*} imageId 
     * @param {*} description 
     * @param {*} tags 
     * @param {*} templateId 
     * @param {string[]} imageTexts
     */
    static async add (userId, imageId, description, tags, templateId=null, imageTexts=null) {
        const meme = new Meme(userId, imageId, description, tags)
        if (templateId) meme.template_id = templateId
        if (imageTexts) meme.image_texts = imageTexts
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.insertOne(meme)
        return meme
    }

    static async find ({id, userId, imageId, keyword, limit=15, skip=0, orderTimeDesc=false}) {
        const filter = {}
        const order = {}
        if (id) filter._id = ObjectID(id)
        if (userId) filter.user_id = ObjectID(userId)
        if (imageId) filter.image_id = ObjectID(imageId)
        if (keyword) {
            let regexString = ''
            for (let i = 0; i < keyword.length; i++) {
                regexString += `.*${keyword[i]}`
            }
            let regexFilter = {'$regex': `${regexString}.*`}
            filter['$or'] = [{description: regexFilter}, {tags: regexFilter}, {image_texts: regexFilter}]
        }
        if (orderTimeDesc) order.upload_time = -1
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).sort(order).limit(limit).skip(skip).toArray()
        return result
    }

    static async findOne(id) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        try {
            return await collection.findOne({_id: ObjectID(id)})
        } catch (e) {
            // for ObjectId invalid
            return null
        }
    }

    static async findByIds(ids) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const objIds = ids.map( (myId) => { return ObjectID(myId) })
        const result = await collection.find({ _id: { '$in': objIds }}).toArray()
        return result
    }

    static async findTrending ({limit=8, skip=0}) {
        const trendLimit = parseInt(limit * 0.2) !== 0 ? parseInt(limit * 0.2): 1 
        const newLimit = parseInt(limit * 0.2) !== 0 ? parseInt(limit * 0.2) : 1
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const trendResult = await collection.find({})
            .sort({like: -1})
            .limit(trendLimit).skip(skip*0.2).toArray()
        const newResult = await collection.find({})
            .sort({upload_time: -1})
            .limit(newLimit).skip(skip*0.2).toArray()
        const randomResult = await collection
            .aggregate([{ $sample: { size: limit-trendResult.length-newResult.length } }])
            .toArray()
        let result = []
        result = result.concat(trendResult)
        result = result.concat(newResult)
        result = result.concat(randomResult)
        utility.shuffle(result)
        return result
    }

    static async like (userId, memeId) {
        const collectionMeme = await database.getCollection(constants.COLLECTION_MEME)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const resultLike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$addToSet': {like_meme_ids: ObjectID(memeId)} })
        const resultDislike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull': {dislike_meme_ids: ObjectID(memeId)}})
        if (resultLike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {like: 1}})
        }
        if (resultDislike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {dislike: -1}})
        }
        return resultLike.result.nModified
    }

    static async dislike (userId, memeId) {
        const collectionMeme = await database.getCollection(constants.COLLECTION_MEME)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const resultLike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull': {like_meme_ids: ObjectID(memeId)} })
        const resultDislike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$addToSet': {dislike_meme_ids: ObjectID(memeId)}})
        if (resultLike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {like: -1}})
        }
        if (resultDislike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {dislike: 1}})
        }
        return resultLike.result.nModified
    }

    static async clearlike (userId, memeId) {
        const collectionMeme = await database.getCollection(constants.COLLECTION_MEME)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const resultLike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull': {like_meme_ids: ObjectID(memeId)} })
        const resultDislike = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull': {dislike_meme_ids: ObjectID(memeId)}})
        if (resultLike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {like: -1}})
        }
        if (resultDislike.result.nModified === 1) {
            await collectionMeme.updateOne({_id: ObjectID(memeId)}, {'$inc': {dislike: -1}})
        }
        return resultLike.result.nModified
    }

    static async delete (memeId) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const meme = await collection.findOne({_id: ObjectID(memeId)})
        if (meme) {
            const imageId = meme.image_id
            await collection.deleteOne({_id: ObjectID(memeId)})
            await Image.increaseUsage(imageId, -1)
        }
    }

    static async increaseCommentNumber(memeId, quantity) {
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.updateOne({_id: ObjectID(memeId)}, {'$inc': {comment_number: quantity}})
    }
}

module.exports = Meme;