const database = require('../database/database.js')
const constants = require('../constants.js')
const Meme = require('./meme.js')
const User = require('./user.js')
const Notification = require('./notification.js')
const ObjectID = require('mongodb').ObjectID

const COMMENT_NORMAL = 'normal'
const COMMENT_REPLY = 'reply'

class Comment {

    /**
     * @param {string} userId user's object id string
     */
    constructor (memeId, userId, content, mode) {
        this.meme_id = ObjectID(memeId)
        this.user_id = ObjectID(userId)
        this.created_at = new Date()
        this.content = content
        this.like = 0
        if (mode === COMMENT_NORMAL) this.reply_number = 0
        else if (mode === COMMENT_REPLY) this._id = new ObjectID()
    }

    static async add (memeId, userId, content) {
        try {
            const comment = new Comment(memeId, userId, content, COMMENT_NORMAL)
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            const meme = await Meme.findOne(memeId)
            if (meme) {
                await collection.insertOne(comment)
                await Meme.increaseCommentNumber(memeId, 1)
                return comment
            } else return null
        } catch (e) {
            // for memeId or userId invalid ObjectID
            return null
        }
    }

    static async addChild (parentCommentId, memeId, userId, content) {
        const comment = new Comment(memeId, userId, content, COMMENT_REPLY)
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        try {
            const result = await collection.findOneAndUpdate(
                {_id: ObjectID(parentCommentId), meme_id: ObjectID(memeId)},
                {'$push': {children:comment}, '$inc': {reply_number: 1}})
            if (result.lastErrorObject.n === 1) {
                await Meme.increaseCommentNumber(memeId, 1)
                return comment
            }
            return null
        } catch (e) {
            // for parentCommentId or memeId invalid ObjectID
            return null
        }
    }

    static async find ({memeId, limit=10, skip=0, getChildren=false}) {
        try {
            const filter = {}
            if (memeId) filter.meme_id = ObjectID(memeId)
            const projection = {children: getChildren}
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            const result = await collection.find(filter, {projection}).sort({created_at: 1}).limit(limit).skip(skip).toArray()
            return result
        } catch (e) {
            return null
        }
    }

    static async findByOrder ({memeId, limit=10, skip=0, getChildren=false}) {
        try {
            const filter = {}
            if (memeId) filter.meme_id = ObjectID(memeId)
            const projection = {children: getChildren}
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            const result = await collection
                .find(filter, {projection})
                .sort({like: -1, reply_number: -1, created_at: 1})
                .limit(limit).skip(skip).toArray()
            return result
        } catch (e) {
            return null
        }
    }

    /**
     * @param {number} skip for children 
     * @param {number} limit for children 
     */
    static async findOne ({id, limit=3, skip=0}) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            const projection = {children: {'$slice': [skip, limit]}}
            return await collection.findOne({_id: ObjectID(id)}, {projection})
        } catch (e) {
            return null
        }
    }

    static async findByIds(ids) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const objIds = ids.map( (myId) => { return ObjectID(myId) })
        const result = await collection.find({ _id: { '$in': objIds }}).toArray()
        return result
    }

    static async findChildComments (parentIds, childIds) {
        const parentObjIds = parentIds.map( (myId) => { return ObjectID(myId) })
        const childObjIds = childIds.map( (myId) => { return ObjectID(myId) })
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const parentComments = await collection
            .find({ _id: { '$in': parentObjIds }})
            .sort({like: -1, created_at: 1})
            .toArray()
        let childrenInEveryParent = []
        const childComments = []
        parentComments.forEach(p => {
            if (p.children) childrenInEveryParent = childrenInEveryParent.concat(p.children)
        })
        childrenInEveryParent.forEach(c => {
            childObjIds.forEach(objId => {
                if (c._id.toString() === objId.toString()) {
                    childComments.push(c)
                }
            })
        })
        return childComments
    }

    static async delete (userId, commentId) {
        const collection = await database.getCollection(constants.COLLECTION_COMMENT)
        const comment = await collection.findOne({_id: ObjectID(commentId), user_id: ObjectID(userId)})
        const result = await collection.deleteOne({_id: ObjectID(commentId), user_id: ObjectID(userId)})
        if (result.result.n === 1) {
            await Meme.increaseCommentNumber(comment.meme_id, -1)
            await Notification.delete({commentId})
        }
    }

    static async like(userId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$addToSet':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne({_id: ObjectID(commentId)}, {'$inc': {like: 1}})
        }
    }

    static async clearlike(userId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne({_id: ObjectID(commentId)}, {'$inc': {like: -1}})
        }
    }

    static async likeReply(userId, parentCommentId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$addToSet':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne(
                {_id: ObjectID(parentCommentId), 'children._id': ObjectID(commentId)},
                {'$inc': {'children.$.like': 1}}
            )
        }
    }

    static async clearLikeReply(userId, parentCommentId, commentId) {
        const collectionComment = await database.getCollection(constants.COLLECTION_COMMENT)
        const collectionUser = await database.getCollection(constants.COLLECTION_USER)
        const result = await collectionUser.updateOne({_id: ObjectID(userId)}, {'$pull':{like_comment_ids: commentId}})
        if (result.result.nModified === 1) {
            await collectionComment.updateOne(
                {_id: ObjectID(parentCommentId), 'children._id': ObjectID(commentId)},
                {'$inc': {'children.$.like': -1}}
            )
        }
    }

    static async deleteByMemeId(memeId) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_COMMENT)
            await collection.deleteMany({meme_id: ObjectID(memeId)})
        } catch (e) {
            // for invalid ObjectID
        }
    }
}

module.exports = Comment