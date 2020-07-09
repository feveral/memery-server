const axios = require('axios')
const config = require('../config.js')
const jwt = require('jsonwebtoken')

module.exports = {
    /**
     * @param {string} accessToken 
     * @return {object} google profile
     */
    async verifyGoogleToken(accessToken) {
        try {
            const result = await axios.get(`${config.googleValidateTokenUrl}?access_token=${accessToken}`);
            return result.data;
        } catch (e) {
            return null
        }
    },

    obtainMemeToken(profile) {
        const payload = { email: profile.email }
        const options = {
            'algorithm': 'HS256',
            'expiresIn': '30d'
        }
        const token = jwt.sign(payload, config.tokenSecret, options)
        return token
    }
}