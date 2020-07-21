const multer = require('@koa/multer')
const authController = require('./controllers/authController.js')
const memeController = require('./controllers/memeController.js')
const imageController = require('./controllers/imageController.js')
const userController = require('./controllers/userController.js')
const tagController = require('./controllers/tagController.js')
const commentController = require('./controllers/commentController.js')

module.exports = (router) => {
    router.post('/api/auth/login', authController.login)
    router.get('/api/user/profile', authController.verifyMemeToken, userController.getProfile)

    router.post('/api/image', authController.verifyMemeToken, multer().single('image'), imageController.upload)
    router.post('/api/meme', authController.verifyMemeToken, memeController.upload)
    router.get('/api/meme/trending', memeController.getTrending)
    router.post('/api/meme/upvote', authController.verifyMemeToken, memeController.upvote)
    router.post('/api/meme/downvote', authController.verifyMemeToken, memeController.downvote)
    router.delete('/api/meme', () => {})
    
    router.get('/api/comment', authController.verifyMemeToken, commentController.getComments)
    router.post('/api/comment', authController.verifyMemeToken, commentController.addComment)
    router.delete('/api/api/comment', () => {})

    router.get('/api/tag', tagController.getTags)
}