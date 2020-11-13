const {Storage} = require('@google-cloud/storage')
const config = require('../config.js')

class GCPSaver {

    constructor () {
        this.storage = new Storage()
        this.imageBucket = this.storage.bucket(config.gcpCloudStorageImageBucket)
    }

    async uploadMemeImage (name, content) {
        const self = this
        return new Promise(function(resolve, reject) {
            const blob = self.imageBucket.file(name)
            const blobStream = blob.createWriteStream()
            blobStream.on('error', (err) => {
                reject(err);
            })
            blobStream.on('finish', () => {
                const publicUrl = 
                    `${config.gcpCloudStorageImageBaseUrl}/${name}`
                resolve(publicUrl)
            })
            blobStream.end(content)
        })
    }

    async removeMemeImage (name) {
        try {
            await this.imageBucket.file(name).delete()
        } catch (e) {
            // console.log(e)
            // ignore No such object Error
        } 
    }

    async uploadUserAvatar (name, content) {
        const self = this
        return new Promise(function(resolve, reject) {
            const blob = self.imageBucket.file(`avatar/${name}`)
            const blobStream = blob.createWriteStream()
            blobStream.on('error', (err) => {
                reject(err);
            })
            blobStream.on('finish', () => {
                const publicUrl = 
                    `${config.gcpCloudStorageImageBaseUrl}/${name}`
                resolve(publicUrl)
            })
            blobStream.end(content)
        })
    }

    async removeUserAvatar (name) {
        try {
            await this.imageBucket.file(`avatar/${name}`).delete()
        } catch (e) {
            // console.log(e)
            // ignore No such object Error
        } 
    }
}

module.exports = new GCPSaver()