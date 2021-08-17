import { ObjectID } from "mongodb"
import database from '../database/database'
const constants = require('../constants.js')

class MemeAction {

    static ACTION_LIKE = 'like'
    static ACTION_DISLIKE = 'dislike'

    public _id: ObjectID
    public user_id: ObjectID
    public meme_id: ObjectID
    public action: string
    public created_at: Date
    public updated_at: Date

    constructor (_id: ObjectID, user_id: ObjectID, meme_id: ObjectID, action: string, created_at: Date, updated_at: Date) {
        this._id = _id
        this.user_id = user_id
        this.meme_id = meme_id
        this.action = action
        this.created_at = created_at
        this.updated_at = updated_at
    }

    // TODO: not yet finished
    static async add (user_id: string | ObjectID, meme_id: string | ObjectID, action: string) {
        if (action !== MemeAction.ACTION_LIKE && action !== MemeAction.ACTION_DISLIKE) return null
        const memeAction = new MemeAction(new ObjectID(), new ObjectID(user_id), new ObjectID(meme_id), action, new Date(), new Date())
        const collection = await database.getCollection(constants.COLLECTION_MEME_ACTION)
        const updatedAt = memeAction.updated_at
        delete memeAction.updated_at
        delete memeAction.action
        await collection.updateOne(
            { user_id: new ObjectID(user_id), meme_id: new ObjectID(meme_id) },
            { $setOnInsert: memeAction, $set: {updated_at: updatedAt, action} },
            { upsert: true }
        )
        memeAction.updated_at = updatedAt
        memeAction.action = action
        return memeAction
    }

    static async clear (user_id: string | ObjectID, meme_id: string | ObjectID) {
        const collection = await database.getCollection(constants.COLLECTION_MEME_ACTION)
        const result = await collection.deleteMany({user_id: new ObjectID(user_id), meme_id: new ObjectID(meme_id)})
        return result.deletedCount > 0
    }

    static async clearByMemeId (meme_id: string | ObjectID) {
        const collection = await database.getCollection(constants.COLLECTION_MEME_ACTION)
        const result = await collection.deleteMany({meme_id: new ObjectID(meme_id)})
        return result.deletedCount > 0
    }
}

export default MemeAction