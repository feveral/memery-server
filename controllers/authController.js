const jwt = require('jsonwebtoken')
const auth = require('../libs/auth.js')
const config = require('../config.js')
const constants = require('../constants.js')
const User = require('../models/user.js')

module.exports = {

    async verifyMemeToken(ctx, next) {
        const authorization = ctx.headers.authorization
        
        if (authorization.substring(0, 7) !== 'Bearer ') {
            ctx.response.status = 401
            ctx.body = {status: false, error: 'token fromat should be "Bearer <jwt token>"'}
            return
        }
        
        const meme_token = authorization.substring(7)
        
        try {
            const user = jwt.verify(meme_token, config.tokenSecret)
            ctx.user = user.id
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

    async registerAnonymous (ctx) {
        const user = await User.add(constants.USER_LEVEL_ANONYMOUS)
        const meme_token = auth.obtainMemeToken(user)
        ctx.body = {status: true, user, meme_token}
    },

    async login(ctx) {
        const type  = ctx.request.body.type // should be 'google' or 'facebook'
        const token = ctx.request.body.token // 'id_token' or 'access_token'
        const tokenType = ctx.request.body.token_type
        const googleProfile = await auth.verifyGoogleToken(token, tokenType)
        if (googleProfile === null) {
            ctx.response.status = 403
            ctx.body = { status: false, error: 'google sign in fail: token invalid or token type invalid.' }
        }
        let user = await User.findOne({googleEmail: googleProfile.email})
        if (!user) user = await User.saveGoogle(googleProfile)
        const meme_token = auth.obtainMemeToken(user)
        ctx.body = { status: true, meme_token }
    },
}