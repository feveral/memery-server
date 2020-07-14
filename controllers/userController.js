const User = require('../models/user.js')

module.exports = {

    async getProfile(ctx) {
        const user = await User.findOne({id: ctx.user})
        if (user) {
            ctx.body = {status: true, user}
        } else {
            ctx.body = {status: false, error: 'user not found'}
        }
    },

    // TODO:
    async updateId (ctx) {
        const newUserId = ctx.request.body
    }
}