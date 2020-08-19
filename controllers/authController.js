const jwt = require('jsonwebtoken')
const auth = require('../libs/auth.js')
const config = require('../config.js')
const User = require('../models/user.js')

module.exports = {

    async verifyMemeToken(ctx, next) {
        const authorization = ctx.headers.authorization
        
        if (!authorization || authorization.substring(0, 6) !== 'Bearer') {
            ctx.response.status = 401
            ctx.body = { message: 'token format should be "Bearer <jwt token>"' }
            return
        }
        
        const meme_token = authorization.substring(7)
        
        try {
            const user = jwt.verify(meme_token, config.tokenSecret)
            ctx.user = user._id
        } catch (e) {
            if (e.name === 'JsonWebTokenError' && e.message === 'invalid token') {
                ctx.response.status = 401
                ctx.body = { message: 'UnAuthorized: invalid token' }
            } else if (e.name === 'TokenExpiredError' && e.message === 'jwt expired') {
                ctx.response.status = 401
                ctx.body = { message: 'UnAuthorized: the token is expired' }
            } else {
                ctx.response.status = 401
                ctx.body = { message: `UnAuthorized: ${e.name}, ${e.message}` }
            }
            return
        }
        await next()
    },

    async login(ctx) {
        const type  = ctx.request.body.type // should be 'google' or 'facebook'
        const token = ctx.request.body.token 
        const tokenType = ctx.request.body.token_type // 'id_token' or 'access_token'
        if (type !== 'google' && type !== 'facebook') {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "type" should be "google" or "facebook".' }
            return 
        } else if (!token) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "token" should be given.' }
            return
        } else if (tokenType !== 'id_token' && tokenType !== 'access_token') {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "token_type" should be "id_token" or "access_token".' }
            return
        }

        if (type === 'google') {
            const googleProfile = await auth.verifyGoogleToken(token, tokenType)
            if (googleProfile === null) {
                ctx.response.status = 401
                ctx.body = { message: 'google sign in fail: token invalid or token type invalid.' }
                return
            }
            let user = await User.findOne({email: googleProfile.email, loginType: 'google'})
            if (!user) user = await User.saveGoogle(googleProfile)
            const meme_token = auth.obtainMemeToken(user)
            ctx.body = {meme_token}
            return
        } else if (type === 'facebook') {
            const facebookProfile = await auth.verifyFacebookToken(token, tokenType)
            if (facebookProfile === null) {
                ctx.response.status = 401
                ctx.body = { message: 'facebook sign in fail: token invalid or token type invalid.' }
                return
            }
            let user = await User.findOne({email: facebookProfile.email, loginType: 'facebook'})
            if (!user) user = await User.saveFacebook(facebookProfile)
            const meme_token = auth.obtainMemeToken(user)
            ctx.body = {meme_token}
            return
        }
        ctx.response.status = 401
        ctx.body = { message: 'authentication fail: something wrong!' }
    },

    async logout(ctx) {
        const userId = ctx.user
        const firebaseToken = ctx.request.body.firebase_token
        if (!firebaseToken) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "firebase_token" should be given.' }
            return
        }
        await User.removeFirebaseDeviceToken(userId, firebaseToken)
        ctx.response.status = 200
        ctx.body = null
    }
}