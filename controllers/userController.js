const User = require('../models/user.js')

module.exports = {

    async getProfile(ctx) {
        const user = await User.findOne({_id: ctx.user})
        delete user.google_profile
        delete user.facebook_profile
        if (user) {
            ctx.body = user
        } else {
            ctx.body = {message: 'user not found'}
        }
    },

    async getUserLike(ctx) {
        const user = await User.findOne({_id: ctx.user, getLikeMemeIds: true, getDislikeMemeIds: true})
        ctx.body = {like_meme_ids: user.like_meme_ids, dislike_meme_ids: user.dislike_meme_ids}
    },

    // TODO:
    async updateCustomId (ctx) {
        const newUserId = ctx.request.body
    }
}