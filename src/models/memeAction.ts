import { ObjectID } from "mongodb"
const database = require('../database/database.js')
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

    static async add (user_id: string | ObjectID, meme_id: string | ObjectID, action: string) {
        if (action !== MemeAction.ACTION_LIKE && action !== MemeAction.ACTION_DISLIKE) return null
    }

}

export default MemeAction