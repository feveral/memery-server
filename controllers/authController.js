const jwt = require('jsonwebtoken')
const googleOAuth = require('../libs/googleOAuth.js')
const config = require('../config.js')
const User = require('../models/user.js')

module.exports = {

    async verifyMemeToken(ctx, next) {
        const auth = ctx.headers.authorization
        
        if (auth.substring(0, 7) !== 'Bearer ') {
            ctx.response.status = 401
            ctx.body = {status: false, error: 'token fromat should be "Bearer <jwt token>"'}
            return
        }
        
        const meme_token = auth.substring(7)
        
        try {
            const userEmail = jwt.verify(meme_token, config.tokenSecret).email
            ctx.user = userEmail
        } catch (e) {
            if (e.name === 'JsonWebTokenError' && e.message === 'invalid token') {
                ctx.response.status = 401
                ctx.body = { status: false, error: 'UnAuthorized: invalid token' }
            } else if (e.name === 'TokenExpiredError' && e.message === 'jwt expired') {
                ctx.response.status = 401
                ctx.body = { status: false, error: 'UnAuthorized: the token is expired' }
            } else {
                ctx.response.status = 401
                ctx.body = { status: false, error: `UnAuthorized: ${e.name}, ${e.message}` }
            }
            return
        }
        await next()
    },

    async login(ctx) {
        if (process.env.NODE_ENV === 'development') {
            const meme_token = googleOAuth.obtainMemeToken({
                email: 'example@gmail.com'
            })
            // TODO: should save user
            ctx.body = {status: true, meme_token}
            return
        }

        const type  = ctx.request.body.type
        const token = ctx.request.bodytoken
        const profile = await googleOAuth.verifyGoogleToken(token)
        if (profile === null) {
            ctx.response.status = 403
            ctx.body = { status: false, error: 'login fail: google access token invalid' }
        }
        const meme_token = googleOAuth.obtainServiceToken(profile)
        const users = await User.find({email: profile.email})
        if (users.length === 0) User.saveGoogle(profile, 'customer')
        ctx.body = { status: true, meme_token }
    },
}