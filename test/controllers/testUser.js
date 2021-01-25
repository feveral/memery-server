const axios = require('axios')
const shortUUID = require('short-uuid')
const chai = require('../libs/chaiInitialize.js')
const config = require('../../config.js')
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
            expect(data.collected_by_others).to.be.equal(0)
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

    describe('#PUT /api/user/profile', () => {
        it('should return 400, custom_id and name not given', async () => {
            const res = axios.put(`${config.serverBaseUrl}/api/user/profile`, {}, axiosHeader()) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "custom_id" or "name" should be given.`
                })
        })

        // this case will pass if the database have this id.
        it('should return 400, custom_id already used by other user', async () => {
            let res = axios.put(`${config.serverBaseUrl}/api/user/profile`, 
                {custom_id: "new_custom_id", name: 'new_name'},
                axiosHeader()
            ) 
            expect(res)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `this id has already been taken.`
                })
        })

        it('should return nothing, success', async () => {
            const newCustomId = shortUUID.generate()
            let res = await axios.put(`${config.serverBaseUrl}/api/user/profile`, 
                {custom_id: newCustomId, name: 'new_name'},
                axiosHeader()
            ) 
            expect(res.status).to.be.equal(204)
            res = await axios.get(`${config.serverBaseUrl}/api/user/profile`, axiosHeader()) 
            expect(res.status).to.be.equal(200)
            const data = res.data
            expect(data.custom_id).to.be.equal(newCustomId)
            expect(data.name).to.be.equal('new_name')
        })
    })
})