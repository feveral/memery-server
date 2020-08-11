const database = require('../database/database.js')

class Notification {

    constructor ({memeId, type, target, userId, commentId, collectId, targetId}) {
        this.read = false
    }

    static async find({id, limit=10, skip=0}) {

    }
}

module.exports = Notification