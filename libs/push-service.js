const admin = require("firebase-admin")
const constants = require('../constants.js')
const config = require('../config.js')

class PushService {

    constructor () {
        this.firebaseAdmin = admin
        this.firebaseAdmin.initializeApp({
            credential: admin.credential.cert(require(config.firebaseAdminKeyPath)),
        });
    }

    async sendComment(os, registrationTokens, content) {
        // another way:
        // const payload = {}
        // payload.notification = {
        //     title: 'this is title',
        //     body: content
        // }
        // payload.android = {
        //     notification: {
        //         channel_id: constants.ANDROID_NOTIFICATION_CHANNEL_COMMENT,
        //     }
        // }
        // payload.token = registrationToken
        // payload.data = {}

        // admin.messaging().send(payload)
        // .then((response) => {
        //     console.log('Successfully sent message:', response);
        // })
        // .catch((error) => {
        //     console.log('Error sending message:', error);
        // });

        const payload = {}
        payload.notification = {
            title: 'this is title',
            body: content,
            android_channel_id: constants.ANDROID_NOTIFICATION_CHANNEL_COMMENT
        }
        payload.data = {}
        try {
            const response = await admin.messaging().sendToDevice(registrationTokens, payload)
            const successTokens = []
            const failTokens = []
            for (let i = 0; i < response.results.length; i++) {
                if (response.results[i].error) failTokens.push(registrationTokens[i])
                else successTokens.push(registrationTokens[i])
            }
            return {successTokens, failTokens}
        } catch (e) {
            console.log('firebase sending fail:', e)
            return null
        }
    }
}

module.exports = new PushService()