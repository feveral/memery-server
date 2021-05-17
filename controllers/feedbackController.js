const SlackNotify = require("../libs/slack-notify")
const User = require("../models/user")


module.exports = {
    async addFeedback (ctx) {
        const user = await User.findOne({id: ctx.user})
        const content = ctx.request.body.content
        let email = ctx.request.body.email || user.email || null        

        if (!email) {
            ctx.response.status = 400
            ctx.body = {message: 'body parameter "email" should be given if user do not have email.'}
            return
        }
        if (!content) {
            ctx.response.status = 400
            ctx.body = {message: 'body parameter "content" should be given.'}
            return
        }
        if (!user) {
            ctx.response.status = 401
            ctx.body = {message: 'UnAuthorization: the user is not exists'}
            return
        }
        try {
            await SlackNotify.sendFeedback(user, email, content)
            ctx.body = {message: 'feedback sent successfully'}
        } catch (e) {
            ctx.response.status = 500
            ctx.body = {message: 'feedback sent failed'}
        }
    }
}
