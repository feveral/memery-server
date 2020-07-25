const database = require('../database/database.js')
const constants = require('../constants.js')

class Tag {

    constructor (name, memeIds) {
        this.name = name
        this.meme_ids = memeIds
    }

    static async addMany (names, memeId) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        for (let i = 0; i < names.length; i++) {
            await collection.updateOne(
                {name: names[i]},
                {'$addToSet': {meme_ids: memeId}},
                {upsert: true}
            )
        }
    }

    static async find({name, limit=7, skip=0}) {
        let nameRegex = ''
        for (let i = 0; i < name.length; i++) {
            nameRegex += `.*${name[i]}`
        }
        const filter = {name: {'$regex': `${nameRegex}.*`}}
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection.find(filter).limit(limit).skip(skip).toArray()
        return result
    }

    static async isTagExist (name) {
        const filter = {name}
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection.find(filter).limit(1).skip(skip)
        return result.length > 0
    }

    static async addMemeToTag (meme) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
    }
}

module.exports = Tag