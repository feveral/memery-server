const database = require('../database/database.js')
const constants = require('../constants.js')

class User {

    constructor (email, loginType, registerTime) {
        this.email = email
        this.loginType = loginType
        this.registerTime = registerTime
    }

    static async saveGoogle (googleProfile) {
        const collection = await database.getCollection(constants.COLLECTION_USER)
        await collection.insertOne({ 
            email: googleProfile.email,
            register_time: new Date(Date.now()),
            login_type: 'google'
        })
    }

    static async find({email, loginType, limit=20, skip=0}) {
        const filter = {}
        if (email) filter.email = email
        if (loginType) filter.login_type = loginType
        const collection = await database.getCollection(constants.COLLECTION_USER)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }
}

module.exports = User;