const axios = require('axios')
const config = require('../config.js')
const jwt = require('jsonwebtoken')
const nodeRSA = require('node-rsa')
const fs = require('fs')

class AppleSignIn {
    constructor () {
        this.appleSignInKey = fs.readFileSync(`${process.cwd()}/apple-sign-in-key.p8`)
        this.applePublicKey = null
        this.clientId = "com.memery"
        this.clientSecret = null
        this.clientSecretExpire = null
        this.refreshApplePublicKey()
    }

    async refreshApplePublicKey () {
        const data = (await axios.get("https://appleid.apple.com/auth/keys")).data
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
            if (jwtClaims.iss === "https://appleid.apple.com"
            && jwtClaims.aud === this.clientId) {
                return jwtClaims
            } else {
                return null
            }
        } catch (e) {
            return null
        }
    }

    refreshClientSecret () {
        this.clientSecretExpire = Math.floor(Date.now() / 1000) + (60 * 60)
        this.clientSecret = jwt.sign({
            iss: "YourTeamID",  // Team ID
            sub: this.clientId, // App Bundle ID
            aud: "https://appleid.apple.com",
            iat: Math.floor(Date.now() / 1000),
            exp: this.clientSecretExpire
        }, private_key, {
            algorithm: 'ES256',
        header: {
            alg: 'ES256',
            kid: "KeyID" // Key ID, should store in a safe place on server side
        }
        })
        return this.clientSecret
    }

}

module.exports = new AppleSignIn()