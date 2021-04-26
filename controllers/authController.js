const jwt = require('jsonwebtoken')
const auth = require('../libs/auth.js')
const config = require('../config.js')
const User = require('../models/user.js')

module.exports = {

    async verifyAdminMemeToken(ctx, next) {
        const authorization = ctx.headers.authorization
        
        if (!authorization || authorization.substring(0, 6) !== 'Bearer') {
            ctx.response.status = 401
            ctx.body = { message: 'token format should be "Bearer <jwt token>"' }
            return
        }
        
        const meme_token = authorization.substring(7)
        
        try {
            let user = jwt.verify(meme_token, config.tokenSecret)
            if (user._id === '5f6eeb30dcdddf465a4f39a7' && user.sign_timestamp < 1611240552838) {
                ctx.response.status = 401
                ctx.body = { message: 'UnAuthorized: this token is not vaild anymore' }
                return
            }
            user = await User.findOne({id: user.id})
            if (user.level === 'admin') {
                ctx.user = user._id
            } else {
                ctx.response.status = 403
                ctx.body = { message: 'permission denied' }
                return
            }
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
            if (user._id === '5f6eeb30dcdddf465a4f39a7' && user.sign_timestamp < 1611240552838) {
                ctx.response.status = 401
                ctx.body = { message: 'UnAuthorized: this token is not vaild anymore' }
                return
            }
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
        const name = ctx.request.body.name
        if (type !== 'google' && type !== 'facebook' && type !== 'apple') {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "type" should be "google", "facebook" or "apple".' }
            return 
        } else if (!token) {
            ctx.response.status = 400
            ctx.body = { message: 'body parameter "token" should be given.' }
            return
        } else if (tokenType !== 'id_token' && tokenType !== 'access_token' && tokenType !== 'code') {
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
            if (process.env.NODE_ENV === 'production') {
                console.log(`LoginType: google, Email: ${googleProfile.email}`)
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
            if (process.env.NODE_ENV === 'production') {
                console.log(`LoginType: facebook, Id: ${facebookProfile.id}`)
            }
            let user = await User.findByFBProfile(facebookProfile)
            if (!user) user = await User.saveFacebook(facebookProfile)
            const meme_token = auth.obtainMemeToken(user)
            ctx.body = {meme_token}
            return
        } else if (type === 'apple') {
            let appleProfile
            if (tokenType === 'id_token') {
                appleProfile = await auth.verifyAppleIdentityToken(token)
            } else if (tokenType === 'code') {
                appleProfile = await auth.verifyAppleAuthorizationCode(token)
            } else {
                ctx.response.status = 401
                ctx.body = { message: 'apple sign in fail: token_type should be "id_token" or "code"' }
                return
            }
            if (appleProfile === null) {
                ctx.response.status = 401
                ctx.body = { message: 'apple sign in fail: authorization code invalid or expire.' }
                return
            }
            if (process.env.NODE_ENV === 'production') {
                console.log(`LoginType: apple, Id: ${appleProfile.sub}`)
            }
            let user = await User.findByAppleProfile(appleProfile)
            if (!user) {
                if (name === undefined) {
                    ctx.response.status = 400
                    ctx.body = { message: 'body parameter "name" should be given when first time to sign in to Apple' }
                    return
                }
                if (name === '') name = 'Memery User'
                user = await User.saveApple(name, appleProfile)
            }
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
