const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const expect = chai.expect

describe('UserApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    before(async () => {
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
    })

    describe('#GET /api/user/profile', () => {
        it('should return user profile', async () => {
            const res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.custom_id).to.be.a('string')
            expect(data.name).to.be.equal('testing-user')
            expect(data.avatar_url).to.be.equal('https://example-user-avatar.com')
            expect(data.level).to.be.equal('regular')
            expect(data.email).to.be.a('string')
            expect(data.login_type).to.be.equal('google')
            expect(data.is_default_id).to.be.equal(true)
            expect(data.register_time).to.be.ISOString()
            expect(data.like_received).to.be.equal(0)
            expect(data.meme_collected).to.be.equal(0)
        })
    })

    describe('#GET /api/user/like', () => {
        it('should return user like arrays', async () => {
            const res = await axios.get(`${config.serverBaseUrl}/api/user/like`, axiosHeader()) 
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data.like_meme_ids).to.be.a('array')
            expect(data.dislike_meme_ids).to.be.a('array')
            expect(data.like_comment_ids).to.be.a('array')
        })
    })
})