const imageThumbnail = require('image-thumbnail')
const fs = require('fs')
const shortUUID = require('short-uuid')
const database = require('../database/database.js')
const config = require('../config.js')
const constants = require('../constants.js')
const awsS3Saver = require('../libs/aws-s3-saver.js')
const { ObjectID } = require('mongodb')

class Image {

    constructor (url, thumbnailUrl, usage=0) {
        this.url = url
        this.thumbnail_url = thumbnailUrl
        this.usage = usage
        this.created_at = new Date()
    }

    static async addToServer (content, ext) {
        const imageId = shortUUID().generate()
        const imageThumbnailId = shortUUID().generate()
        const thumbnail = await imageThumbnail(content)
        fs.writeFile(`images/${imageThumbnailId}.${ext}`, thumbnail, () => {})
        fs.writeFile(`images/${imageId}.${ext}`, content, () => {})
        const image = new Image(`${config.serverBaseUrl}/${imageId}.${ext}`, `${config.serverBaseUrl}/${imageThumbnailId}.${ext}`)
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        await collection.insertOne(image)
        return image
    }

    static async addToAWSS3 (content, ext) {
        const imageId = shortUUID().generate()
        const imageThumbnailId = shortUUID().generate()
        const thumbnail = await imageThumbnail(content)
        awsS3Saver.uploadMemeImage(`${imageId}.${ext}`, content)
        awsS3Saver.uploadMemeImage(`${imageThumbnailId}.${ext}`, thumbnail)
        const image = new Image(`${config.awsS3MemeImageBaseUrl}/${imageId}.${ext}`, `${config.awsS3MemeImageBaseUrl}/${imageThumbnailId}.${ext}`)
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        await collection.insertOne(image)
        return image
    }

    static async find ({id, url, thumbnail_url, usage}) {
        const filter = {}
        if (id) filter._id = ObjectID(id)
        if (url) filter.url = url
        if (thumbnail_url) filter.thumbnail_url = thumbnail_url
        if (usage) filter.usage = usage
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        return await collection.findOne(filter)
    }

    static async findByIds (ids) {
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        const objIds = ids.map( (myId) => { return ObjectID(myId) })
        const result = await collection.find({ _id: { '$in': objIds }}).toArray()
        return result
    }

    static async increaseUsage(id, quantity) {
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        await collection.updateOne({_id: ObjectID(id)}, {'$inc': {usage: quantity}})
        const image = await collection.findOne({_id: ObjectID(id)})
        const urlSplit = image.url.split('/')
        const thumbnailUrlSplit = image.thumbnail_url.split('/')
        const filename = urlSplit[urlSplit.length-1]
        const thumbnailFilename = thumbnailUrlSplit[thumbnailUrlSplit.length-1]

        // These are for store image on server
        // if (image.usage === 0) {
        //     await collection.deleteOne({_id: ObjectID(id)})
        //     fs.unlink(`images/${filename}`, () => {})
        //     fs.unlink(`images/${thumbnailFilename}`, () => {})
        // }

        // These is for AWS S3
        if (image.usage === 0) {
            await collection.deleteOne({_id: ObjectID(id)})
            awsS3Saver.removeMemeImage(filename)
            awsS3Saver.removeMemeImage(thumbnailFilename)
        }
    }

    static async isImageExist(id) {
        try { 
            const collection = await database.getCollection(constants.COLLECTION_IMAGE)
            await collection.find({_id: ObjectID(id)}, {_id: 1}).limit(1)
            const result = await collection.findOne({_id: ObjectID(id)})
            return result !== null
        } catch (e) {
            // for ObjectId illegal
            return false
        }
    }
}

module.exports = Image