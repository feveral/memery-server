const ObjectID = require('mongodb').ObjectID
const database = require('../database/database.js')
const constants = require('../constants.js')
const config = require('../config.js')

class User {

    /**
     * @param {string} id 
     * @param {string} level can be 'anonymous', 'regular', 'admin'
     * @param {Date} registerTime 
     */
    constructor (customId, name, avatar_url, level, isDefaultId, registerTime, upvoteMemeIds, downvoteMemeIds) {
        this.custom_id = customId
        this.name = name
        this.avatar_url = avatar_url
        this.level = level
        this.is_default_id = isDefaultId
        this.register_time = registerTime
        this.upvote_meme_ids = upvoteMemeIds
        this.downvote_meme_ids = downvoteMemeIds
    }

    static async add ({customId, level, name='', avatar_url=''}) {
        //TODO: should block attack ip address
        //TODO: should revise the way to find 'max id'
        //TODO: should use transaction
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser
            .find({is_default_id: true})
            .collation({locale: "en_US", numericOrdering: true}) // to keep sorting as number
            .sort({custom_id: -1}).limit(1).toArray()
        let newCustomId = parseInt(result.custom_id)
        if (Number.isInteger(newCustomId)) {
            newCustomId = (result.length > 0)
                                ? parseInt(result[0].custom_id) + 1
                                : parseInt(config.customIdStart) + 1
        } else {
            newCustomId = config.customIdStart
        }
        const user = new User(customId || newCustomId.toString(), name, avatar_url, level, true, new Date(), [], [])
        await collectionUser.insertOne(user)
        return user
    }

    static async saveGoogle (googleProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add({level: constants.USER_LEVEL_REGULAR, name: googleProfile.name, avatar_url: googleProfile.picture})
        await collection.updateOne(
            {custom_id: user.custom_id},
            {'$set': {google_profile: googleProfile}},
            {upsert: true})
        return await User.findOne({custom_id: user.custom_id})
    }

    static async saveFacebook (facebookProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add({level: constants.USER_LEVEL_REGULAR, name: facebookProfile.name})
        await collection.updateOne(
            {custom_id: user.custom_id}, 
            {'$set': {facebook_profile: facebookProfile}},
            {upsert: true}
        )
        return await User.findOne({custom_id: user.custom_id})
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

    static async findOne ({_id, customId, googleEmail, facebookEmail, getGoogleProfile=false, getFacebookProfile=false, getUpvoteMemeId=false, getDownvoteMemeId=false}) {
        const filter = {}
        if (_id) filter._id = ObjectID(_id)
        if (customId) filter.custom_id = customId
        if (googleEmail) filter['google_profile.email'] = googleEmail
        if (facebookEmail) filter['facebook_profile.email'] = facebookEmail
        const projection = {
            google_profile: getGoogleProfile,
            facebook_profile: getFacebookProfile,
            upvote_meme_ids: getUpvoteMemeId,
            downvote_meme_ids: getDownvoteMemeId,
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

    //TODO: not testing
    //TODO: should use transaction 
    static async updateCustomId (oldCustomId, newCustomId) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const isNewIdEsist = await User.findOne({custom_id: newUserId})
        if (isNewIdEsist) throw Error('user id has already used.')
        await collection.updateOne(
            {custom_id: oldUserId},
            {'$set': {id: newUserId}
        })
    }
}

module.exports = User