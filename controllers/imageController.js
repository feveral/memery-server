const fs = require('fs')

module.exports = {

    async upload (ctx) {
        // TODO: filename random
        fs.writeFileSync('images/bmk3.jpg', ctx.file.buffer)
        ctx.body = {status: true}
    }
}