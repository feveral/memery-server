const multer = require('@koa/multer')
const authController = require('./controllers/authController.js')
const memeController = require('./controllers/memeController.js')
const imageController = require('./controllers/imageController.js')
const userController = require('./controllers/userController.js')
const tagController = require('./controllers/tagController.js')
const commentController = require('./controllers/commentController.js')
const collectController = require('./controllers/collectController.js')

module.exports = (router) => {
    router.post('/api/auth/login', authController.login)
    router.get('/api/user/profile', authController.verifyMemeToken, userController.getProfile)
    router.get('/api/user/like', authController.verifyMemeToken, userController.getUserLike)
    router.get('/api/user/comment/like', authController.verifyMemeToken, () => {})
    router.put('/api/user/id', authController.verifyMemeToken, userController.updateCustomId)

    router.get('/api/image', authController.verifyMemeToken, imageController.getImageInfo)
    router.post('/api/image', authController.verifyMemeToken, multer().single('image'), imageController.upload)

    router.post('/api/meme', authController.verifyMemeToken, memeController.upload)
    router.get('/api/meme', authController.verifyMemeToken, memeController.getUserMeme)
    router.get('/api/meme/search', memeController.search)
    router.get('/api/meme/trending', memeController.getTrending)
    router.post('/api/meme/like', authController.verifyMemeToken, memeController.like)
    router.delete('/api/meme', authController.verifyMemeToken, memeController.delete)
    
    router.get('/api/comment', commentController.getComments)
    router.post('/api/comment', authController.verifyMemeToken, commentController.addComment)
    router.delete('/api/comment', authController.verifyMemeToken, commentController.deleteComment)

    router.get('/api/tag', tagController.getTags)

    router.get('/api/collect', authController.verifyMemeToken, collectController.getUserCollect)
    router.post('/api/collect', authController.verifyMemeToken, collectController.addCollect)
    router.delete('/api/collect', authController.verifyMemeToken, collectController.deleteCollect)

    router.get('/api/notification', () => {})
}