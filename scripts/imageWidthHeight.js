require('dotenv').config()

const database = require('../database/database.js');
const constants = require('../constants.js');
const probe = require('probe-image-size');
const { ObjectID } = require('mongodb');

(
    async () => {

        const collection = await database.getCollection(constants.COLLECTION_IMAGE)
        let isFinish = false
        let counter = 0
        while (!isFinish) {
            
            const images = await collection.find().skip(counter).limit(20).toArray()
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                console.log("image", image)
                try {
                    const probeResult = await probe(images[i].url)
                    let width = 0
                    let height = 0
                    console.log(probeResult)
                    if (probeResult.orientation >= 5) {
                        width = probeResult.height
                        height = probeResult.width
                    } else {
                        width = probeResult.width
                        height = probeResult.height
                    }
                    await collection.updateOne(
                            {_id: ObjectID(image._id)},
                            {$set: {width: width, height: height}}
                    )
                } catch (e) {
                    console.log(`${e.name}: ${e.message}`)
                    await collection.updateOne(
                        {_id: ObjectID(image._id)},
                        {$set: {width: 0, height: 0}}
                    )
                }
                console.log('-'.repeat(process.stdout.columns))
            }
            counter += images.length
            if (images.length === 0) isFinish = true
        }
    }
)()