const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const fs = require('fs')
const expect = chai.expect
const FormData = require('form-data')

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

    describe('#POST /api/image', () => {

        it('should return 400, ext not given', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/image`, {}, axiosHeader()) 
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `query parameter "ext" should be "jpg" or "png" or "jpeg" or "gif".`
                })
        })

        it('should return 400, ext invalid', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/image?ext=mp4`, {}, axiosHeader()) 
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `query parameter "ext" should be "jpg" or "png" or "jpeg" or "gif".`
                })
        })

        it('should return 400 form-data not given', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/image?ext=gif`, {}, axiosHeader()) 
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `image file should be in body form-data.`
                })
        })

        it('should return image information', async () => {
            const formData = new FormData()
            formData.append('image', fs.createReadStream('./test/images/small.jpeg'))
            let options = {
                headers: {
                    Authorization: authorization(),
                    ...formData.getHeaders()
                }
            }
            const res = await axios.post(`${config.serverBaseUrl}/api/image?ext=jpeg`, formData, options)
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data._id).to.be.a('string')
            expect(data.url).to.be.a('string')
            expect(data.thumbnail_url).to.be.a('string')
            expect(data.created_at).to.be.ISOString()
            expect(data.usage).to.be.a('number')
        })
    })
})
