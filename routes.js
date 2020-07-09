const multer = require('@koa/multer')
const authController = require('./controllers/authController.js')
const memeController = require('./controllers/memeController.js')
const imageController = require('./controllers/imageController.js')
const userController = require('./controllers/userController.js')

module.exports = (router) => {
    router.get('/api/test', (ctx)=> ctx.body = {status: true})
    router.post('/api/login', authController.login)
    router.post('/api/image', authController.verifyMemeToken, multer().single('image'), imageController.upload)
    router.post('/api/meme', memeController.upload)
}