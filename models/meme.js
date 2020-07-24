const database = require('../database/database.js')
const constants = require('../constants.js')
const ObjectID = require('mongodb').ObjectID

class Meme {
    /**
     * @param {string} userId user's object id string
     */
    constructor (userId, imageUrl, description, tags, like, dislike, upload_time) {
        this.user_id = ObjectID(userId)
        this.image_url = imageUrl
        this.description = description
        this.tags = tags
        this.like = like
        this.dislike = dislike
        this.upload_time = upload_time
    }

    static async add (userId, imageUrl, description, tags) {
        const meme = new Meme(userId, imageUrl, description, tags, 0, 0, new Date())
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        await collection.insertOne(meme)
        return meme
    }

    static async find ({id, userId, imageUrl, description, limit=15, skip=0}) {
        const filter = {}
        if (id) filter._id = id
        if (userId) filter.userid = userId
        if (imageUrl) filter.imageUrl = imageUrl
        if (description) filter.description = RegExp(`${description}`,'i')
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async findTrending ({limit=8, skip=0}) {
        const filter = {}
        const collection = await database.getCollection(constants.COLLECTION_MEME)
        const result = await collection.find(filter).sort({upload_time: -1}).limit(limit).skip(skip).toArray()
        return result
    }

    //TODO: need transaction
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
    }

    //TODO: need transaction
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
    }

    //TODO: need transaction
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
    }
}

module.exports = Meme;