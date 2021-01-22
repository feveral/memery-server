const database = require('../database/database.js')
const constants = require('../constants.js')
const utility = require('../libs/utility')
const { ObjectID } = require('mongodb')

class Tag {

    constructor (name, memeIds) {
        this.name = name
        this.meme_ids = memeIds
        this.meme_number = 0
    }

    static async addMany (names, memeId) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        for (let i = 0; i < names.length; i++) {
            const result = await collection.updateOne(
                {name: names[i]},
                {'$addToSet': {meme_ids: memeId}},
                {upsert: true}
            )
            if (result.result.nModified === 1 || result.result.upserted) {
                await collection.updateOne({name: names[i]}, {'$inc': {meme_number: 1}})
            }
        }
    }

    static async find({name, limit=7, skip=0}) {
        let nameRegex = ''
        for (let i = 0; i < name.length; i++) {
            nameRegex += `.*${name[i]}`
        }
        const filter = {name: {'$regex': `${nameRegex}.*`, $options: 'i'}}
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection
            .find(filter, { projection:{meme_ids: false}})
            .sort({meme_number:-1})
            .limit(limit).skip(skip).toArray()
        return result
    }

    static async findTrendAndRandom({limit=10, skip=0}) {
        const trendLimit = parseInt(limit * 0.3)
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const trendResult = await collection.find({}, { projection:{meme_ids: false}})
            .sort({upload_time: -1})
            .limit(trendLimit).skip(skip*0.3).toArray()

        const excludeIds = []

        trendResult.forEach((m) => {
            excludeIds.push(m._id)
        })
        
        const randomResult = await collection
            .aggregate([
                { $match: {_id: {$nin: excludeIds}}},
                { $project: {meme_ids: false}},
                // { $sample: { size: limit-trendResult.length-newResult.length } }])
                { $sample: { size: limit-trendResult.length } }])
            .toArray()
        let result = []
        result = result.concat(trendResult)
        result = result.concat(randomResult)
        utility.shuffle(result)
        return result
    }

    static async deleteMemeId (name, memeId) {
        const collection = await database.getCollection(constants.COLLECTION_TAG)
        const result = await collection.updateOne({name}, {'$pull': {meme_ids: ObjectID(memeId)}})
        if (result.result.nModified === 1) {
            await collection.updateOne({name}, {'$inc': {meme_number: -1}})
        }
    }
}

module.exports = Tag