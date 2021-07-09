const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')


class VideoUtils {
    constructor() {}

    static fileTom3u8(dirPath, fileName) {
        return new Promise(function(resolve, reject) {
            ffmpeg(`${dirPath}/${fileName}`)
                .audioCodec('copy')
                .videoCodec('copy')
                .addOutputOption(["-f segment", "-segment_time 2", `-segment_list ${dirPath}/playlist.m3u8`])
                .output(`${dirPath}/segment%03d.ts`)
                .on('end', function() {
                    resolve()
                })
                .on('error', function(err) {
                    reject(err)
                })
                .run()
        })
    }

    static fileToThumbnail(dirPath, fileName) {
        return new Promise(function(resolve, reject) {
            ffmpeg(`${dirPath}/${fileName}`)
                .screenshots({
                    timestamps: ['0%'],
                    filename: `thumbnail.jpg`,
                    folder: dirPath,
                    // size: '240x240'
                })
                .on('end', function() {
                    resolve()
                })
                .on('error', function(err) {
                    reject(err)
                })
        })
    }

    static isFormatLegal(filePath, ext) {
        return new Promise(function(resolve, reject) {
            if (ext === '') resolve(false)
            ffmpeg.ffprobe(filePath, function(err, metadata) {
                if (err) {
                    console.log(err)
                    resolve(false)
                } else {
                    if (metadata.format.format_name.split(',').includes(ext)) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                }
            })
        })
    }

}

module.exports = VideoUtils