const database = require('../database/database.js')
const constants = require('../constants.js')

class Tag {

    constructor (name, memes) {
        this.name = name
        this.memes = memes
    }

    static async add (name, memes) {
        const tag = new Tag(name, memes)
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        await collection.insertOne(tag)
        return tag
    }

    static async addMany (names, memeId) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const tags = []
        names.forEach((name) => {
            tags.push(new Tag(name, []))
        })
        for (let i = 0; i < tags.length; i++) {
            await collection.updateOne(
                {name: tags[i].name},
                {'$push': {meme_ids: memeId}},
                {upsert: true}
            )
        }
    }

    static async find({name, limit=7, skip=0}) {
        const filter = {name: RegExp(`${name}`,'i')}
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection.find(filter).limit(limit).skip(skip)
        return result
    }

    static async isTagExist (name) {
        const filter = {name}
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection.find(filter).limit(limit).skip(skip)
        return result.length > 0
    }

    static async addMemeToTag (meme) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
    }
}

module.exports = Tag