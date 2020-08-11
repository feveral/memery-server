const Notification = require("../models/notification")

//TODO: 
async function notificationsAddInfo(notifications) {
    const userIds = []
    const memeIds = []
    notifications.forEach(n => {
        
    })
}


module.exports = {
    async getNotifications(ctx) {
        const userId = ctx.user
        const skip = parseInt(ctx.query.skip) || 0
        const limit = parseInt(ctx.query.limit) || 20
        const notifications = await Notification.find({userId, limit, skip})
        ctx.body = notifications
    },

    async readNotifications(ctx) {
        const userId = ctx.user
        await Notification.read(userId)
        ctx.response.status = 200
        ctx.body = null
    }
}