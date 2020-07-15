const User = require('../models/user.js')

module.exports = {

    async getProfile(ctx) {
        const user = await User.findOne({id: ctx.user})
        if (user) {
            ctx.body = user
        } else {
            ctx.body = {message: 'user not found'}
        }
    },

    // TODO:
    async updateId (ctx) {
        const newUserId = ctx.request.body
    }
}