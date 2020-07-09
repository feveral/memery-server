const User = require('../models/user.js')

module.exports = {

    async getProfile(ctx) {
        const users = await User.find({email: ctx.user})
        if (users.length >= 1) {
            ctx.body = {status: true, profile: users[0]}
        } else if (users.length === 0) {
            ctx.body = {status: false, error: 'profile not found'}
        }
    }
}