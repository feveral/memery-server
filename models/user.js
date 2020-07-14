const database = require('../database/database.js')
const constants = require('../constants.js')
const config = require('../config.js')

class User {

    /**
     * @param {string} id 
     * @param {string} level can be 'anonymous', 'regular', 'admin'
     * @param {Date} registerTime 
     */
    constructor (id, level, registerTime) {
        this.id = id
        this.level = level
        this.register_time = registerTime
    }

    static async add (level) {
        //TODO: should revise the way to find 'max id'
        //TODO: should use transaction
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser
            .find({level: constants.USER_LEVEL_ANONYMOUS})
            .collation({locale: "en_US", numericOrdering: true}) // to keep sorting as number
            .sort({id: -1}).limit(1).toArray()
        const newUserId = (result.length > 0) 
                            ? parseInt(result[0].id) + 1
                            : parseInt(config.userIdStart) + 1
        const user = new User(newUserId.toString(), level, new Date())
        await collectionUser.insertOne(user)
        return user
    }

    static async saveGoogle (googleProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add(constants.USER_LEVEL_REGULAR)
        await collection.updateOne(
            {id: user.id},
            {'$set': {google_profile: googleProfile}},
            {upsert: true})
        return await User.findOne({id: user.id})
    }

    static async saveFacebook (facebookProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const user = await User.add(constants.USER_LEVEL_REGULAR)
        await collection.updateOne(
            {id: user.id}, 
            {'$set': {facebook_profile: facebookProfile}},
            {upsert: true}
        )
    }

    static async find ({id, level, limit=20, skip=0}) {
        const filter = {}
        if (id) filter.id = id
        if (level) filter.level = level
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async findOne ({id, googleEmail, facebookEmail}) {
        const filter = {}
        if (id) filter.id = id
        if (googleEmail) filter.google_profile = {email: googleEmail}
        if (facebookEmail) filter.facebook_profile = {email: facebookEmail}
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const result = await collection.findOne(filter, {projection:{_id: 0}})
        return result
    }

    //TODO: should use transaction 
    static async updateUserId (oldUserId, newUserId) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const isNewIdEsist = await User.isUserExist(newUserId)
        if (isNewIdEsist) throw Error('user id has already used.')
        await collection.updateOne(
            {id: oldUserId},
            {'$set': {id: newUserId}
        })
    }
}

module.exports = User