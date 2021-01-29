const axios = require('axios')
const { URL } = require('url');
const config = require('../config.js')
const jwt = require('jsonwebtoken')
const nodeRSA = require('node-rsa')
const jose = require('node-jose')
const fs = require('fs')
const AppleAuth = require('apple-auth')

const ENDPOINT_URL = 'https://appleid.apple.com'
const TOKEN_ISSUER = 'https://appleid.apple.com'
const SCOPE = 'name email'
const CLIENT_ID = "com.memery"
const TEAM_ID = "PY7NKJMQL8"
const KEY_ID = '49F3MQ6BHQ'

class AppleSignIn {
    constructor () {
        this.appleSignInKey = fs.readFileSync(`${process.cwd()}/${config.appleSignInKeyPath}`)
        this.applePublicKey = null
        this.refreshApplePublicKey()
    }

    async refreshApplePublicKey () {
        const data = (await axios.get(`${ENDPOINT_URL}/auth/keys`)).data
        // const key = data.keys[0];
        // const pubKey = new nodeRSA()
        // pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public')
        // this.applePublicKey = pubKey.exportKey(['public'])
        this.applePublicKey = await jose.JWK.asKeyStore(data)
    }

    async verifyAuthorizationCode (authorizationCode) {
        if (!this.applePublicKey) {
            await this.refreshApplePublicKey()
        }
        const configure = {
            "client_id": CLIENT_ID,
            "team_id": TEAM_ID,
            "key_id": KEY_ID,
            "redirect_uri": "https://example.com/auth",
            "scope": SCOPE
        };
        try {
            const auth = new AppleAuth(configure, config.appleSignInKeyPath);
            const tokenResponse = (await auth.accessToken(authorizationCode))
            const verify = jose.JWS.createVerify(this.applePublicKey)
            const jwtClaims = await verify.verify(tokenResponse.id_token)
            // const jwtClaims = jwt.verify(tokenResponse.id_token, this.applePublicKey, { algorithms: 'RS256' })
            const appleProfile = JSON.parse(jwtClaims.payload.toString())
            if (appleProfile.iss === TOKEN_ISSUER
            && appleProfile.aud === CLIENT_ID) {
                return appleProfile
            } else {
                return null
            }
        } catch (e) {
            console.log('[libs/appleSignIn]: verify authorization code failed')
            console.log(e)
            return null
        }
    }

    async verifyIdentityToken (idToken) {
        if (!this.applePublicKey) {
            await this.refreshApplePublicKey()
        }
        try  {
            const verify = jose.JWS.createVerify(this.applePublicKey)
            const jwtClaims = await verify.verify(idToken)
            const appleProfile = JSON.parse(jwtClaims.payload.toString())
            if (appleProfile.iss === TOKEN_ISSUER
            && appleProfile.aud === CLIENT_ID) {
                return appleProfile
            } else {
                return null
            }
        }  catch (e) {
            console.log('[libs/appleSignIn]: verify identity token failed')
            console.log(e)
            return null
        }
    }
}

module.exports = new AppleSignIn()