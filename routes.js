const multer = require('@koa/multer')
const authController = require('./controllers/authController.js')
const memeController = require('./controllers/memeController.js')
const imageController = require('./controllers/imageController.js')
const userController = require('./controllers/userController.js')
const tagController = require('./controllers/tagController.js')
const commentController = require('./controllers/commentController.js')
const collectController = require('./controllers/collectController.js')
const notificationController = require('./controllers/notificationController.js')
const templateController = require('./controllers/templateController.js')

module.exports = (router) => {
    router.post('/api/auth/login', authController.login)
    router.post('/api/auth/logout', authController.verifyMemeToken, authController.logout)
    router.get('/api/user/profile', authController.verifyMemeToken, userController.getProfile)
    router.get('/api/user/profile/:id', userController.getProfile)
    router.get('/api/user/like', authController.verifyMemeToken, userController.getUserLike)
    router.post('/api/user/firebase/device', authController.verifyMemeToken, userController.addFirebaseDeviceToken)
    router.put('/api/user/profile', authController.verifyMemeToken, userController.updateProfile)
    router.put('/api/user/avatar', authController.verifyMemeToken, multer().single('image'), userController.updateAvatar)

    router.get('/api/image/:id', authController.verifyMemeToken, imageController.getImageInfo)
    router.post('/api/image', authController.verifyMemeToken, multer().single('image'), imageController.upload)

    router.post('/api/meme', authController.verifyMemeToken, memeController.upload)
    router.get('/api/meme', memeController.search)
    router.get('/api/meme/trending', memeController.getTrending)
    router.get('/api/meme/user/:id', memeController.getUserMeme)
    router.get('/api/meme/:id', memeController.getMemeById)
    router.post('/api/meme/like', authController.verifyMemeToken, memeController.like)
    router.delete('/api/meme', authController.verifyMemeToken, memeController.delete)
    
    router.get('/api/comment', commentController.getComments)
    router.get('/api/comment/reply', commentController.getCommentReply)
    router.post('/api/comment', authController.verifyMemeToken, commentController.addComment)
    router.post('/api/comment/like', authController.verifyMemeToken, commentController.likeComment)
    router.delete('/api/comment', authController.verifyMemeToken, commentController.deleteComment)

    router.get('/api/tag', tagController.getTags)

    router.get('/api/template', templateController.getTemplates)
    router.post('/api/template', authController.verifyMemeToken, templateController.addTemplate)

    router.get('/api/collect', authController.verifyMemeToken, collectController.getUserCollect)
    router.post('/api/collect', authController.verifyMemeToken, collectController.addCollect)
    router.delete('/api/collect', authController.verifyMemeToken, collectController.deleteCollect)

    router.get('/api/notification', authController.verifyMemeToken, notificationController.getNotifications)
    router.post('/api/notification/read', authController.verifyMemeToken, notificationController.readNotifications)
}