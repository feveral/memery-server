const User = require('../models/user.js')
const Meme = require('../models/meme.js')
const Collect = require('../models/collect.js')

module.exports = {

    async getProfile(ctx) {
        const userId = ctx.user
        const user = await User.findOne({id: userId})
        const memes = await Meme.find({userId})
        let likes = 0
        for (let i = 0; i < memes.length; i++) {
            likes += memes[i].like
        }
        user.like_received = likes
        user.meme_collected = await Collect.count({ownerUserId: userId})
        delete user.google_profile
        delete user.facebook_profile
        if (user) {
            ctx.body = user
        } else {
            ctx.body = {message: 'user not found'}
        }
    },

    async getUserLike(ctx) {
        const user = await User.findOne({id: ctx.user, getLikeDislikeMemeIds: true})
        ctx.body = {like_meme_ids: user.like_meme_ids, dislike_meme_ids: user.dislike_meme_ids}
    },

    // TODO:
    async updateCustomId (ctx) {
        const newUserId = ctx.request.body
    }
}