const axios = require('axios')
const config = require('../config.js')
const jwt = require('jsonwebtoken')

module.exports = {
    /**
     * @param {string} accessToken 
     * @return {object} google profile
     */
    async verifyGoogleToken (token, tokenType) {
        try {
            const result = await axios.get(`${config.googleValidateTokenUrl}?${tokenType}=${token}`);
            return result.data;
        } catch (e) {
            return null
        }
    },

    async verifyFacebookToken (token, tokenType) {
        try {
            const result = await axios.get(`${config.facebookValidateTokenUrl}?${tokenType}=${token}&fields=id,name,email,picture.type(small)`);
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
    }
}