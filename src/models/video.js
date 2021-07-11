import database from '../database/database'
const imageThumbnail = require('image-thumbnail')
const fs = require('fs').promises
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const shortUUID = require('short-uuid')
const config = require('../config.js')
const constants = require('../constants.js')
const gcpSaver = require('../libs/gcp-saver.js')
const VideoUtils = require('../libs/videoUtils.js')
const { ObjectID } = require('mongodb')


class Video {

    constructor (url, thumbnailUrl, usage=0) {
        this.url = url
        this.thumbnail_url = thumbnailUrl
        this.usage = usage
        this.created_at = new Date()
    }

    static async addToGCPCloudStorage (mp4Content, ext) {
        const videoId = shortUUID().generate()
        await mkdirp(`videos/${videoId}`)
        await fs.writeFile(`videos/${videoId}/video.${ext}`, mp4Content)
        if (!await VideoUtils.isFormatLegal(`videos/${videoId}/video.${ext}`, ext)) {
            rimraf(`videos/${videoId}`, (err) => {})
            return null
        }
        await VideoUtils.fileTom3u8(`videos/${videoId}`, `video.${ext}`)
        await VideoUtils.fileToThumbnail(`videos/${videoId}`, `video.${ext}`)
        await fs.unlink(`videos/${videoId}/video.${ext}`)

        gcpSaver.uploadMemeVideo(videoId, `videos/${videoId}`)
        rimraf(`videos/${videoId}`, (err) => {})

        const video = new Video(
            `${config.gcpCloudStorageVideoBaseUrl}/${videoId}/playlist.m3u8`,
            `${config.gcpCloudStorageVideoBaseUrl}/${videoId}/thumbnail.jpg`)
        const collection = await database.getCollection(constants.COLLECTION_VIDEO)
        await collection.insertOne(video)
        return video
    }

    static async find ({id, url, thumbnail_url, usage, limit=20, skip=0}) {
        const filter = {}
        if (id) filter._id = ObjectID(id)
        if (url) filter.url = url
        if (thumbnail_url) filter.thumbnail_url = thumbnail_url
        if (usage) filter.usage = usage
        const collection = await database.getCollection(constants.COLLECTION_VIDEO)
        return await collection.find(filter).limit(limit).skip(skip).toArray()
    }

    static async findOne(id) {
        try {
            const collection = await database.getCollection(constants.COLLECTION_VIDEO)
            return await collection.findOne({_id: ObjectID(id)})
        } catch (e) {
            // for ObjectId invalid
            return null
        }
    }

}

module.exports = Video
