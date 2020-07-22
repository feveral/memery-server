const fs = require('fs')
const shortUUID = require('short-uuid')
const database = require('../database/database.js')
const config = require('../config.js')
const constants = require('../constants.js')

class Image {

    constructor (url, usage) {
        this.url = url
        this.usage = usage
    }

    static async addToServer (content, ext) {
        const imageId = shortUUID().generate()
        fs.writeFileSync(`images/${imageId}.${ext}`, content)
        const image = new Image(`${config.serverBaseUrl}/${imageId}.${ext}`, 1)
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        await collection.insertOne(image)
        return image
    }

    static async addToAWSS3 () {

    }

    static async find ({url, usage}) {
        const filter = {}
        if (url) filter.url = url
        if (usage) filter.usage = usage
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        return await collection.findOne(filter)
    }

    static async increaseUsage(url, quantity) {
        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        await collection.updateOne({url}, {'$inc': quantity})
        return Image.find({url})
    }
}

module.exports = Image