const {Storage} = require('@google-cloud/storage');
const config = require('../config.js')

class GCPSaver {

    constructor () {
        this.storage = new Storage()
        this.bucketMemeImage = this.storage.bucket(config.gcpCloudStorageMemeImageBucket)
        this.bucketUserAvatar = this.storage.bucket(config.gcpCloudStorageUserAvatarBucket)
    }

    async uploadMemeImage (name, content) {
        const self = this
        return new Promise(function(resolve, reject) {
            const blob = self.bucketMemeImage.file(name)
            const blobStream = blob.createWriteStream()
            blobStream.on('error', (err) => {
                reject(err);
            })
            blobStream.on('finish', () => {
                const publicUrl = 
                    `${config.gcpCloudStorageMemeImageBaseUrl}/${name}`
                resolve(publicUrl)
            })
            blobStream.end(content)
        })
    }

    async removeMemeImage (name) {
        await this.storage.bucket(config.gcpCloudStorageMemeImageBucket).file(name).delete()
    }

    async uploadUserAvatar (name, content) {
        const self = this
        return new Promise(function(resolve, reject) {
            const blob = self.bucketUserAvatar.file(name)
            const blobStream = blob.createWriteStream()
            blobStream.on('error', (err) => {
                reject(err);
            })
            blobStream.on('finish', () => {
                const publicUrl = 
                    `${config.gcpCloudStorageUserAvatarBaseUrl}/${name}`
                resolve(publicUrl)
            })
            blobStream.end(content)
        })
    }

    async removeUserAvatar (name) {
        try {
            await this.storage.bucket(config.gcpCloudStorageUserAvatarBucket).file(name).delete()
        } catch (e) {
            // ignore No such object Error
        } 
    }
}

module.exports = new GCPSaver()