const axios = require('axios')
const chai = require('../libs/chaiInitialize.js')
const config = require('../../src/config.js')
const FormData = require('form-data')
const fs = require('fs')
const expect = chai.expect

describe('CommentApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let secondMemeToken = ''
    let authorizationSecond = () => {return `Bearer ${secondMemeToken}`}
    let axiosHeaderSecond = () => {return {headers: {Authorization: authorizationSecond()}}}

    let memeId = ''
    let imageId = ''

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
        res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
            image_id: imageId, description: 'this is description', tags: ['atag', 'btag'],
        }, axiosHeader())
        memeId = res.data._id

        // upload comment user
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
        commentUserId = res.data._id
        commentCustomId = res.data.custom_id
        commentUserName = res.data.name
        commentUserAvatarUrl = res.data.avatar_url

        // reply comment user
        secondMemeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeaderSecond()) 
        replyUserId = res.data._id
        replyCustomId = res.data.custom_id
        replyUserName = res.data.name
        replyUserAvatarUrl = res.data.avatar_url
    })

    describe('#POST /api/comment/ ', async () => {

        it('should return 400, meme_id not given', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/comment`, {}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "meme_id" should be given.`
                })
        })

        it('should return 400, content not given', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/comment`, {meme_id: memeId}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "content" should be given.`
                })
        })

        it('should return 400, meme_id invalid ', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/comment`, {meme_id: 'memeId', content: '123'}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `meme_id invalid.`
                })
        })

        it('should return 400, parent_comment_id invalid.', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/comment`, 
                {meme_id: memeId, parent_comment_id: 'parentCommentId', content: '123'}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `parent_comment_id or meme_id invalid.`
                })
        })

        it('should return 400, parent_comment_id legal but not related to meme_id.', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/comment`, 
                {meme_id: memeId, parent_comment_id: commentUserId, content: '123'}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `parent_comment_id or meme_id invalid.`
                })
        })

        it('should return comment, reply meme', async () => {
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, content: 'this is a comment to meme',
            }, axiosHeader())
            let data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.meme_id).to.be.equal(memeId)
            expect(data.user_id).to.be.equal(commentUserId)
            expect(data.created_at).to.be.ISOString()
            expect(data.like).to.be.equal(0)
        })

        it('should return child comment, reply comment', async () => {
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, content: 'this is a comment to be reply',
            }, axiosHeader())
            let parentCommentId = res.data._id
            res = await axios.post(`${config.serverBaseUrl}/api/comment`, {
                meme_id: memeId, parent_comment_id: parentCommentId, content: 'this is a reply comment',
            }, axiosHeaderSecond())
            let data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.meme_id).to.be.equal(memeId)
            expect(data.user_id).to.be.equal(replyUserId)
            expect(data.created_at).to.be.ISOString()
            expect(data.like).to.be.equal(0)
        })
    })

    describe('#GET /api/comment/ ', async () => {

        it('should return 400, meme_id not given.', async () => {
            const res = axios.get(`${config.serverBaseUrl}/api/comment`) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `query parameter "meme_id" should be given.`
                })
        })

        /**
         * this test case is depends on above tests
         */
        it('should return comments related to memeId', async () => {
            res = await axios.get(`${config.serverBaseUrl}/api/comment?meme_id=${memeId}`)
            let data = res.data
            expect(res.status).to.be.equal(200)
            expect(data).to.be.a('array')

            // reply_number have more priority to show on the top
            expect(data[0]._id).to.be.a('string')
            expect(data[0].meme_id).to.be.equal(memeId)
            expect(data[0].user_id).to.be.equal(commentUserId)
            expect(data[0].user_name).to.be.equal(commentUserName)
            expect(data[0].user_custom_id).to.be.equal(commentCustomId)
            expect(data[0].user_avatar_url).to.be.equal(commentUserAvatarUrl)
            expect(data[0].content).to.be.equal('this is a comment to be reply')
            expect(data[0].created_at).to.be.ISOString()
            expect(data[0].like).to.be.equal(0)
            expect(data[0].reply_number).to.be.equal(1)

            expect(data[1]._id).to.be.a('string')
            expect(data[1].meme_id).to.be.equal(memeId)
            expect(data[1].user_id).to.be.equal(commentUserId)
            expect(data[1].user_name).to.be.equal(commentUserName)
            expect(data[1].user_custom_id).to.be.equal(commentCustomId)
            expect(data[1].user_avatar_url).to.be.equal(commentUserAvatarUrl)
            expect(data[1].content).to.be.equal('this is a comment to meme')
            expect(data[1].created_at).to.be.ISOString()
            expect(data[1].like).to.be.equal(0)
            expect(data[1].reply_number).to.be.equal(0)
        })
    })
})