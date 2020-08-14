const AWS = require('aws-sdk')
const config = require('../config.js')

class AWSS3Saver {
    constructor () {
        this.s3 = new AWS.S3({
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey
        });
    }

    async uploadMemeImage(name, content) {
        const params = {
            Bucket: config.awsS3MemeImageBucket,
            Key: name,
            Body: content
        }
        await this._upload(params)
    }

    async removeMemeImage(name) {
        const params = {
            Bucket: config.awsS3MemeImageBucket,
            Key: name,
        }
        await this._remove(params)
    }

    async _upload(params) {
        const self = this
        return new Promise(function(resolve, reject) {
            self.s3.upload(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async _remove(params) {
        const self = this
        return new Promise(function(resolve, reject) {
            self.s3.deleteObject(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}
module.exports = new AWSS3Saver()