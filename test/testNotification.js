const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const FormData = require('form-data')
const fs = require('fs')
const expect = chai.expect

describe('NotificationApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let secondMemeToken = ''
    let authorizationSecond = () => {return `Bearer ${secondMemeToken}`}
    let axiosHeaderSecond = () => {return {headers: {Authorization: authorizationSecond()}}}

    let thirdMemeToken = ''
    let authorizationThird = () => {return `Bearer ${thirdMemeToken}`}
    let axiosHeaderThird = () => {return {headers: {Authorization: authorizationThird()}}}

    let memeId = ''
    let imageId = ''
    let imageUrl = ''
    let imageThumbnailUrl = ''

    let memeUserId = ''
    let memeCustomId = ''
    let memeUserName = ''
    let memeUserAvatarUrl = ''

    let commentUserId = ''
    let commentCustomId = ''
    let commentUserName = ''
    let commentUserAvatarUrl = ''

    let replyUserId = ''
    let replyCustomId = ''
    let replyUserName = ''
    let replyUserAvatarUrl = ''

    /**
     * using a temp user and create a meme to be comment
     * initial first meme token user for having a normal comment
     * initial second meme token user for having a reply comment
     */
    before(async () => {
        // upload meme user
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        let res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
        memeUserId = res.data._id
        memeCustomId = res.data.custom_id
        memeUserName = res.data.name
        memeUserAvatarUrl = res.data.avatar_url

        const formData = new FormData()
        formData.append('image', fs.createReadStream('./test/images/small.jpeg'))
        let options = {
            headers: {
                Authorization: authorization(),
                ...formData.getHeaders()
            }
        }
        res = await axios.post(`${config.serverBaseUrl}/api/image?ext=jpeg`, formData, options)
        imageId = res.data._id
        imageUrl = res.data.url
        imageThumbnailUrl = res.data.thumbnail_url
        res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
            image_id: imageId, description: 'this is description', tags: ['atag', 'btag'],
        }, axiosHeader())
        memeId = res.data._id

        // upload comment user
        secondMemeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeaderSecond()) 
        commentUserId = res.data._id
        commentCustomId = res.data.custom_id
        commentUserName = res.data.name
        commentUserAvatarUrl = res.data.avatar_url

        // reply comment user
        thirdMemeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeaderThird()) 
        replyUserId = res.data._id
        replyCustomId = res.data.custom_id
        replyUserName = res.data.name
        replyUserAvatarUrl = res.data.avatar_url
    })

    describe('#GET /api/notification', async () => {
        it('should return notification list, test reply meme notification', async () => {
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, content: 'this is a comment to meme',
            }, axiosHeaderSecond())
            let commentId = res.data._id
            res = await axios.get(`${config.serverBaseUrl}/api/notification`, axiosHeader())
            let data = res.data
            expect(res.status).to.be.equal(200)
            expect(data).to.be.a('array')
            expect(data[0]._id).to.be.a('string')
            expect(data[0].type).to.be.equal('reply_meme')
            expect(data[0].comment_id).to.be.equal(commentId)
            expect(data[0].comment_content).to.be.equal('this is a comment to meme')
            expect(data[0].meme_id).to.be.equal(memeId)
            expect(data[0].user_id).to.be.equal(memeUserId)
            expect(data[0].create_at).to.be.ISOString()
            expect(data[0].read).to.be.equal(false)
            expect(data[0].action_user_id).to.be.equal(commentUserId)
            expect(data[0].action_user_name).to.be.equal(commentUserName)
            expect(data[0].action_user_avatar_url).to.be.equal(commentUserAvatarUrl)
            expect(data[0].action_user_custom_id).to.be.equal(commentCustomId)
            expect(data[0].meme_like_number).to.be.equal(0)
            expect(data[0].meme_image_url).to.be.equal(imageUrl)
            expect(data[0].meme_image_thumbnail_url).to.be.equal(imageThumbnailUrl)
        })

        it('should return notification list, test reply comment notification', async () => {
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, content: 'this is a comment to meme',
            }, axiosHeaderSecond())
            let parentCommentId = res.data._id
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, parent_comment_id: parentCommentId, content: 'this is a comment to reply',
            }, axiosHeaderThird())
            let commentId = res.data._id
            res = await axios.get(`${config.serverBaseUrl}/api/notification`, axiosHeaderSecond())
            let data = res.data
            expect(res.status).to.be.equal(200)
            expect(data).to.be.a('array')
            expect(data[0]._id).to.be.a('string')
            expect(data[0].type).to.be.equal('reply_comment')
            expect(data[0].comment_id).to.be.equal(commentId)
            expect(data[0].parent_comment_id).to.be.equal(parentCommentId)
            expect(data[0].parent_comment_content).to.be.equal('this is a comment to meme')
            expect(data[0].meme_id).to.be.equal(memeId)
            expect(data[0].user_id).to.be.equal(commentUserId)
            expect(data[0].create_at).to.be.ISOString()
            expect(data[0].read).to.be.equal(false)
            expect(data[0].action_user_id).to.be.equal(replyUserId)
            expect(data[0].action_user_name).to.be.equal(replyUserName)
            expect(data[0].action_user_avatar_url).to.be.equal(replyUserAvatarUrl)
            expect(data[0].action_user_custom_id).to.be.equal(replyCustomId)
            expect(data[0].meme_like_number).to.be.equal(0)
            expect(data[0].meme_image_url).to.be.equal(imageUrl)
            expect(data[0].meme_image_thumbnail_url).to.be.equal(imageThumbnailUrl)
        })

        it('should return notification list, test like meme notification', async () => {
            // res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
            //     meme_id: memeId, content: 'this is a comment to meme',
            // }, axiosHeaderSecond())
            // let parentCommentId = res.data._id
            // res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
            //     meme_id: memeId, parent_comment_id: parentCommentId, content: 'this is a comment to reply',
            // }, axiosHeaderThird())
            // let commentId = res.data._id
            // res = await axios.get(`${config.serverBaseUrl}/api/notification`, axiosHeaderSecond())
            // let data = res.data
            // expect(res.status).to.be.equal(200)
            // expect(data).to.be.a('array')
            // expect(data[0]._id).to.be.a('string')
            // expect(data[0].type).to.be.equal('reply_comment')
            // expect(data[0].comment_id).to.be.equal(commentId)
            // expect(data[0].parent_comment_id).to.be.equal(parentCommentId)
            // expect(data[0].parent_comment_content).to.be.equal('this is a comment to meme')
            // expect(data[0].meme_id).to.be.equal(memeId)
            // expect(data[0].user_id).to.be.equal(commentUserId)
            // expect(data[0].create_at).to.be.ISOString()
            // expect(data[0].read).to.be.equal(false)
            // expect(data[0].action_user_id).to.be.equal(replyUserId)
            // expect(data[0].action_user_name).to.be.equal(replyUserName)
            // expect(data[0].action_user_avatar_url).to.be.equal(replyUserAvatarUrl)
            // expect(data[0].action_user_custom_id).to.be.equal(replyCustomId)
            // expect(data[0].meme_like_number).to.be.equal(0)
            // expect(data[0].meme_image_url).to.be.equal(imageUrl)
            // expect(data[0].meme_image_thumbnail_url).to.be.equal(imageThumbnailUrl)
        })
    })
})