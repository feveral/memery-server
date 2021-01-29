const axios = require('axios')
const { URL } = require('url');
const config = require('../config.js')
const jwt = require('jsonwebtoken')
const nodeRSA = require('node-rsa')
const fs = require('fs')
const AppleAuth = require('apple-auth')

const ENDPOINT_URL = 'https://appleid.apple.com'
const TOKEN_ISSUER = 'https://appleid.apple.com'
const SCOPE = 'name email'
const CLIENT_ID = "com.memery"
const TEAN_ID = "PY7NKJMQL8"
const KEY_ID = '49F3MQ6BHQ'

class AppleSignIn {
    constructor () {
        this.appleSignInKey = fs.readFileSync(`${process.cwd()}/${config.appleSignInKeyPath}`)
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

    async verifyAuthorizationCode (authorizationCode) {
        if (!this.applePublicKey) {
            await this.refreshApplePublicKey()
        }
        const configure = {
            "client_id": CLIENT_ID,
            "team_id": TEAN_ID,
            "key_id": KEY_ID,
            "redirect_uri": "https://example.com/auth",
            "scope": SCOPE
        };
        try {
            const auth = new AppleAuth(configure, './apple-sign-in-key.p8');
            const tokenResponse = (await auth.accessToken(authorizationCode))
            const jwtClaims = jwt.verify(tokenResponse.id_token, this.applePublicKey, { algorithms: 'RS256' })
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