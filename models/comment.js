const database = require('../database/database.js')
const constants = require('../constants.js')

class Comment {

    constructor (memeId, userId, createdAt, content) {
        this.meme_id = memeId
        this.user_id = userId
        this.created_at = createdAt
        this.content = content
    }

    static async add (memeId, userId, content) {
        const comment = new Comment(memeId, userId, new Date(), content)
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        await collection.insertOne(comment)
        return comment
        // const time = new Date()
        // await collection.updateOne({meme_id: memeId, count:{ $lt: 3 }, start_time: { $gte: time }, end_time: { $lte: time }},
        //     {
        //         '$push': { comments: { user_id: userId, created_at: time, content } },
        //         '$inc': { count: 1 },
        //         '$set': { end_time: { count: {}}},
        //         '$setOnInsert': {
        //             create_at: time,
        //         }
        //     },
        //     {upsert: true}
        // )
    }

    static async find ({memeId, limit=20, skip=0}) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const result = await collection.find({meme_id: memeId}).sort({created_at: 1}).limit(limit).skip(skip).toArray()
        return result
    }
}

module.exports = Comment