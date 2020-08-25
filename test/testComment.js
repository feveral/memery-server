const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const FormData = require('form-data')
const fs = require('fs')
const expect = chai.expect

describe('CopmmentApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let memeId = ''
    let userId = ''
    let userCustomId = ''
    let userName = ''
    let userAvatarUrl = ''

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

    describe('#POST /api/comment/ ', async () => {

        //TODO:
        it('should return 400, meme_id not given', async () => {
            // const res = axios.post(`${config.serverBaseUrl}/api/meme`, {}, axiosHeader()) 
            // expect(res)
            //     .to.eventually.be.rejectedWith(Error)
            //     .and.have.nested.include({
            //         'response.status': 400,
            //         'response.data.message': `body parameter "image_id" should be given.`
            //     })
        })

        //TODO:
        it('should return 400, content not given', async () => {
            // const res = axios.post(`${config.serverBaseUrl}/api/meme`, {}, axiosHeader()) 
            // expect(res)
            //     .to.eventually.be.rejectedWith(Error)
            //     .and.have.nested.include({
            //         'response.status': 400,
            //         'response.data.message': `body parameter "image_id" should be given.`
            //     })
        })
    })
})