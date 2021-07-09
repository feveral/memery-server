const axios = require('axios')
const chai = require('../libs/chaiInitialize.js')
const config = require('../../src/config.js')
const FormData = require('form-data')
const fs = require('fs')
const expect = chai.expect

describe('MemeApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let secondMemeToken = ''
    let authorizationSecond = () => {return `Bearer ${secondMemeToken}`}
    let axiosHeaderSecond = () => {return {headers: {Authorization: authorizationSecond()}}}

    let userId = ''
    let userCustomId = ''
    let userName = ''
    let userAvatarUrl = ''
    let secondUserId = ''
    let secondUserCustomId = ''
    let secondUserName = ''
    let secondUserAvatarUrl = ''

    before(async () => {
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        let res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
        userId = res.data._id
        userCustomId = res.data.custom_id
        userName = res.data.name
        userAvatarUrl = res.data.avatar_url

        secondMemeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
        res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
        secondUserId = res.data._id
        secondUserCustomId = res.data.custom_id
        secondUserName = res.data.name
        secondUserAvatarUrl = res.data.avatar_url
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

        let memeId
        let image

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
            image = await uploadImage()
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
            image = await uploadImage()
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
            memeId = data._id
        })

        //TODO: using template id
        it('should return meme, using template', async () => {

        })
    })

    describe('#GET /api/meme/:id', async () => {

        let meme
        let image

        before(async () => {
            image = await uploadImage()
            const res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
                image_id: image._id,
                tags: 'onetag'
            }, axiosHeader()) 
            meme = res.data
        })

        it('should return meme', async () => {
            const res = await axios.get(`${config.serverBaseUrl}/api/meme/${meme._id}`)
            const data = res.data
            expect(data).to.deep.equal(meme)
        })
    })

    describe('#POST /api/meme/like', async () => {

        let meme
        let image

        before(async () => {
            image = await uploadImage()
            const res = await axios.post(`${config.serverBaseUrl}/api/meme`, {
                image_id: image._id,
                tags: 'onetag'
            }, axiosHeader())
            meme = res.data
        })

        it('should return nothing, test like ', async () => {
            await axios.post(`${config.serverBaseUrl}/api/meme/like`, {meme_id: meme._id, action: 'like'}, axiosHeaderSecond())
            let res = await axios.get(`${config.serverBaseUrl}/api/meme/${meme._id}`)
            let data = res.data
            expect(data.like).to.deep.equal(meme.like + 1)
            expect(data.dislike).to.deep.equal(meme.dislike)

            // like twice should not increase like number
            await axios.post(`${config.serverBaseUrl}/api/meme/like`, {meme_id: meme._id, action: 'like'}, axiosHeaderSecond())
            expect(data.like).to.deep.equal(meme.like + 1)
            expect(data.dislike).to.deep.equal(meme.dislike)

            res = await axios.get(`${config.serverBaseUrl}/api/user/like`, axiosHeaderSecond())
            data = res.data
            expect(data.like_meme_ids).to.deep.include(meme._id)
            expect(data.dislike_meme_ids).to.not.deep.include(meme._id)
        })

        // continue with above cases
        it('should return nothing, test dislike', async () => {
            await axios.post(`${config.serverBaseUrl}/api/meme/like`, {meme_id: meme._id, action: 'dislike'}, axiosHeaderSecond())
            let res = await axios.get(`${config.serverBaseUrl}/api/meme/${meme._id}`)
            let data = res.data
            expect(data.like).to.deep.equal(meme.like)
            expect(data.dislike).to.deep.equal(meme.dislike + 1)

            // dislike twice should not increase dislike number
            await axios.post(`${config.serverBaseUrl}/api/meme/like`, {meme_id: meme._id, action: 'dislike'}, axiosHeaderSecond())
            expect(data.like).to.deep.equal(meme.like)
            expect(data.dislike).to.deep.equal(meme.dislike + 1)

            res = await axios.get(`${config.serverBaseUrl}/api/user/like`, axiosHeaderSecond())
            data = res.data
            expect(data.like_meme_ids).to.not.deep.include(meme._id)
            expect(data.dislike_meme_ids).to.deep.include(meme._id)
        })

        // continue with above cases
        it('should return nothing, test clearlike', async () => {
            await axios.post(`${config.serverBaseUrl}/api/meme/like`, {meme_id: meme._id, action: 'clearlike'}, axiosHeaderSecond())
            let res = await axios.get(`${config.serverBaseUrl}/api/meme/${meme._id}`)
            let data = res.data
            expect(data.like).to.deep.equal(meme.like)
            expect(data.dislike).to.deep.equal(meme.dislike)

            res = await axios.get(`${config.serverBaseUrl}/api/user/like`, axiosHeaderSecond())
            data = res.data
            expect(data.dislike_meme_ids).to.not.deep.include(meme._id)
            expect(data.like_meme_ids).to.not.deep.include(meme._id)
        })
    })
})
