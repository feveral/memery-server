const ObjectID = require('mongodb').ObjectID
const imageThumbnail = require('image-thumbnail')
const shortUUID = require('short-uuid')
const database = require('../database/database.js')
const constants = require('../constants.js')
const config = require('../config.js')
const awsS3Saver = require('../libs/aws-s3-saver.js')

class User {

    /**
     * @param {string} level 'regular' || 'admin'
     */
    constructor (customId, name, avatar_url, level, isDefaultId) {
        this.custom_id = customId
        this.name = name
        this.avatar_url = avatar_url
        this.level = level
        this.is_default_id = isDefaultId
        this.register_time = new Date()
        this.like_meme_ids = []
        this.dislike_meme_ids = []
        this.like_comment_ids = []
    }

    static async add ({level, name='', avatar_url=''}) {
        const client = await database.getClient()
        const session = client.startSession()
        let user
        try {
            await session.withTransaction(async () => {
                const collectionUser = await database.getCollection(constants.COLLECTION_USER)
                const result = await collectionUser
                    .find({is_default_id: true}, { session })
                    .collation({locale: "en_US", numericOrdering: true}) // to keep sorting as number
                    .sort({custom_id: -1}).limit(1).toArray()
                let newCustomId = (result.length > 0)
                                        ? parseInt(result[0].custom_id) + 1
                                        : parseInt(config.customIdStart) + 1
                user = new User(newCustomId.toString(), name, avatar_url, level, true)
                await collectionUser.insertOne(user, { session })
            })
        } finally {
            await session.endSession()
            return user
        }
    }

    static async saveGoogle (googleProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add({level: constants.USER_LEVEL_REGULAR, name: googleProfile.name, avatar_url: googleProfile.picture})
        await collection.updateOne(
            {custom_id: user.custom_id},
            {'$set': {google_profile: googleProfile}},
            {upsert: true})
        return await User.findOne({customId: user.custom_id})
    }

    static async saveFacebook (facebookProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add({level: constants.USER_LEVEL_REGULAR, name: facebookProfile.name, avatar_url: facebookProfile.picture.data.url})
        await collection.updateOne(
            {custom_id: user.custom_id}, 
            {'$set': {facebook_profile: facebookProfile}},
            {upsert: true}
        )
        return await User.findOne({customId: user.custom_id})
    }

    static async find ({_id, customId, level, limit=20, skip=0}) {
        const filter = {}
        if (_id) filter._id = ObjectID(_id)
        if (customId) filter.custom_id = customId
        if (level) filter.level = level
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async findOne ({id, customId, googleEmail, facebookEmail, getLikeIds=false}) {
        const filter = {}
        if (id) filter._id = ObjectID(id)
        if (customId) filter.custom_id = customId
        if (googleEmail) filter['google_profile.email'] = googleEmail
        if (facebookEmail) filter['facebook_profile.email'] = facebookEmail
        const projection = {
            like_meme_ids: getLikeIds,
            dislike_meme_ids: getLikeIds,
            like_comment_ids: getLikeIds,
        }
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const result = await collection.findOne(filter, {projection})
        return result
    }

    static async findByIds(ids) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const objIds = ids.map( (myId) => { return ObjectID(myId) })
        const result = await collection.find({ _id: { '$in': objIds }}).toArray()
        return result
    }

    static async updateCustomId (userId, newCustomId) {
        const client = await database.getClient()
        const session = client.startSession()
        let isNewIdExist
        try {
            const collection = await database.getCollection(constants.COLLECTION_USER)
            isNewIdExist = await User.findOne({customId: newCustomId}, {session})
            if (isNewIdExist) throw Error('user id has already used.')
            await collection.findOneAndUpdate(
                {_id: ObjectID(userId)},
                {'$set': {custom_id: newCustomId, is_default_id: false}},
                {session}
            )
        } catch (e) {
            throw Error('user id has already used.')
        } finally {
            await session.endSession()
        }
    }

    static async addFirebaseDeviceToken(userId, token) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        await collection.findOneAndUpdate(
            {_id: ObjectID(userId)},
            {'$addToSet': {firebase_devices: token}}
        )
    }

    static async removeFirebaseDeviceToken(userId, token) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        await collection.findOneAndUpdate(
            {_id: ObjectID(userId)},
            {'$pull': {firebase_devices: token}}
        )
    }

    static async updateAvatar(userId, avatarContent, ext) {
        const user = await User.findOne({id: userId})
        if (user) {
            const imageId = shortUUID().generate()
            await awsS3Saver.uploadUserAvatar(`${imageId}.${ext}`, avatarContent)
            const newAvatarUrl = `${config.awsS3UserAvatarBaseUrl}/${imageId}.${ext}`
            const oldAvatarUrlSplit = user.avatar_url.split('/')
            const oldAvatarName = oldAvatarUrlSplit[oldAvatarUrlSplit.length-1]
            await awsS3Saver.removeUserAvatar(oldAvatarName)
            const collection = await database.getCollection(constants.COLLECTION_USER)
            await collection.updateOne({_id: ObjectID(userId)}, {'$set': {avatar_url: newAvatarUrl}})
        }
    }
}

module.exports = User