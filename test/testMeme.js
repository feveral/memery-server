const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const FormData = require('form-data')
const fs = require('fs')
const expect = chai.expect

describe('MemeApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let memeId = ''
    let userId = ''
    let userCustomId = ''
    let userName = ''
    let userAvatarUrl = ''
    let image

    before(async () => {
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        const res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
        userId = res.data._id
        userCustomId = res.data.custom_id
        userName = res.data.name
        userAvatarUrl = res.data.avatar_url
    })

    async function uploadImage () {
        const formData = new FormData()
        formData.append('image', fs.createReadStream('./test/images/small.jpeg'))
        let options = {
            headers: {
                Authorization: authorization(),
                ...formData.getHeaders()
            }
        }
        let res = await axios.post(`${config.serverBaseUrl}/api/image?ext=jpeg`, formData, options)
        return res.data
    }

    describe('#POST /api/meme', async () => {

        it('should return 400, image_id not given', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/meme`, {}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "image_id" should be given.`
                })
        })

        it('should return 400, tags not given', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/meme`, 
                {image_id: 'fake_image_id'}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "tags" should be an array of string or a string.`
                })
        })

        it('should return 400, tags not given', async () => {
            const res = axios.post(`${config.serverBaseUrl}/api/meme`, 
                {image_id: 'fake_image_id'}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "tags" should be an array of string or a string.`
                })
        })

        it('should return meme, not using template, multiple tags', async () => {
            const image = await uploadImage()
            res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
                image_id: image._id, description: 'this is description',
                tags: ['atag', 'btag'],
            }, axiosHeader()) 
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.image_id).to.be.equal(image._id)
            expect(data.user_id).to.be.equal(userId)
            expect(data.tags).to.have.lengthOf(2)
            expect(data.tags[0]).to.be.equal('atag')
            expect(data.tags[1]).to.be.equal('btag')
            expect(data.like).to.be.equal(0)
            expect(data.dislike).to.be.equal(0)
            expect(data.comment_number).to.be.equal(0)
            expect(data.upload_time).to.be.ISOString()
            expect(data.user_custom_id).to.be.equal(userCustomId)
            expect(data.user_name).to.be.equal(userName)
            expect(data.user_avatar_url).to.be.equal(userAvatarUrl)
            expect(data.image_url).to.be.equal(image.url)
            expect(data.image_thumbnail_url).to.be.equal(image.thumbnail_url)
            memeId = data._id
        })

        it('should return meme, not using template, one tags', async () => {
            const image = await uploadImage()
            res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
                image_id: image._id,
                tags: 'onetag'
            }, axiosHeader()) 
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.image_id).to.be.equal(image._id)
            expect(data.user_id).to.be.equal(userId)
            expect(data.tags).to.have.lengthOf(1)
            expect(data.tags[0]).to.be.equal('onetag')
            expect(data.like).to.be.equal(0)
            expect(data.dislike).to.be.equal(0)
            expect(data.comment_number).to.be.equal(0)
            expect(data.upload_time).to.be.ISOString()
            expect(data.user_custom_id).to.be.equal(userCustomId)
            expect(data.user_name).to.be.equal(userName)
            expect(data.user_avatar_url).to.be.equal(userAvatarUrl)
            expect(data.image_url).to.be.equal(image.url)
            expect(data.image_thumbnail_url).to.be.equal(image.thumbnail_url)
        })

        //TODO: using template id
        it('should return meme, using template', async () => {

        })
    })

    describe('#POST /api/meme/like', async () => {
        it('should return nothing, check like number and user like update', async () => {
            
        })
    })
})