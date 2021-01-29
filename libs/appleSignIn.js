const axios = require('axios')
const { URL } = require('url');
const config = require('../config.js')
const jwt = require('jsonwebtoken')
const nodeRSA = require('node-rsa')
const fs = require('fs')

const ENDPOINT_URL = 'https://appleid.apple.com'
const TOKEN_ISSUER = 'https://appleid.apple.com'
const DEFAULT_SCOPE = 'name email'
const CLIENT_ID = "com.memery"
const TEAN_ID = "PY7NKJMQL8"
const KEY_ID = '49F3MQ6BHQ'

class AppleSignIn {
    constructor () {
        // this.appleSignInKey = fs.readFileSync(`${process.cwd()}/apple-sign-in-key.p8`)
        this.applePublicKey = null
        this.refreshApplePublicKey()
    }

    async refreshApplePublicKey () {
        const data = (await axios.get(`${ENDPOINT_URL}/auth/keys`)).data
        const key = data.keys[0];
        const pubKey = new nodeRSA()
        pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public')
        this.applePublicKey = pubKey.exportKey(['public'])
    }

    async verifyIdentityToken (idToken) {
        if (!this.applePublicKey) {
            await this.refreshApplePublicKey()
        }
        try {
            const jwtClaims = jwt.verify(idToken, this.applePublicKey, { algorithms: 'RS256' })
            if (jwtClaims.iss === TOKEN_ISSUER
            && jwtClaims.aud === CLIENT_ID) {
                return jwtClaims
            } else {
                return null
            }
        } catch (e) {
            console.log('[libs/appleSignIn]: verify authorization code failed')
            console.log(e)
            return null
        }
    }
}

module.exports = new AppleSignIn()