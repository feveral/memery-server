const multer = require('@koa/multer')
const authController = require('./controllers/authController.js')
const memeController = require('./controllers/memeController.js')
const imageController = require('./controllers/imageController.js')
const userController = require('./controllers/userController.js')
const tagController = require('./controllers/tagController.js')

module.exports = (router) => {
    router.post('/api/auth/anonymous', authController.registerAnonymous)
    router.post('/api/auth/login', authController.login)
    router.get('/api/user/profile', authController.verifyMemeToken, userController.getProfile)
    router.post('/api/image', authController.verifyMemeToken, multer().single('image'), imageController.upload)
    router.post('/api/meme', authController.verifyMemeToken, memeController.upload)
    router.get('/api/tag', tagController.getTags)
}