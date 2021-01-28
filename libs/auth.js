const shortUUID = require('short-uuid')
const axios = require('axios')
const config = require('../config.js')
const jwt = require('jsonwebtoken')
const nodeRSA = require('node-rsa')
const fs = require('fs')
const appleSignIn = require('./appleSignIn.js')

let appleSignInKey = fs.readFileSync(`${process.cwd()}/apple-sign-in-key.p8`)
let applePublicKey = null
let appleClientId = ""
let appleClientSecret = null

module.exports = {
    /**
     * @param {string} accessToken 
     * @return {object} google profile
     */
    async verifyGoogleToken (token, tokenType) {
        if (process.env.NODE_ENV === 'test') {
            return {
                name: 'testing-user',
                email: `${shortUUID().generate()}@gmail.com`,
                // email: `testing-email@gmail.com`,
                picture: 'https://example-user-avatar.com'
            }
        }
        try {
            const result = await axios.get(`${config.googleValidateTokenUrl}?${tokenType}=${token}`);
            return result.data;
        } catch (e) {
            return null
        }
    },

    async verifyFacebookToken (token, tokenType) {
        try {
            const result = await axios.get(`${config.facebookValidateTokenUrl}?${tokenType}=${token}&fields=id,name,email,picture.type(large)`);
            return result.data;
        } catch (e) {
            return null
        }
    },

    obtainMemeToken (user) {
        const payload = JSON.stringify({_id: user._id, sign_timestamp: Date.now()})
        const options = {'algorithm': 'HS256'}
        const token = jwt.sign(payload, config.tokenSecret, options)
        return token
    },

    async verifyAppleIdentityToken (idToken) {
        return await appleSignIn.verifyIdentityToken(idToken)
    },
}