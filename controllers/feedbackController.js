const SlackNotify = require("../libs/slack-notify")
const User = require("../models/user")


module.exports = {
    async addFeedback (ctx) {
        const user = await User.findOne({id: ctx.user})
        const email = ctx.request.body.email
        const content = ctx.request.body.content
        
        if (!email) {
            ctx.response.status = 400
            ctx.body = {message: 'body parameter "email" should be given.'}
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
