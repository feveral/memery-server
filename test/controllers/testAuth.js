const axios = require('axios')
const chai = require('../libs/chaiInitialize.js')
const config = require('../../src/config.js')
const expect = chai.expect

describe('AuthApi', function () {
    let memeToken = ''
    let authorization = `Bearer ${memeToken}`

    describe('#POST /api/auth/login', () => {
        it('should return 400, "type" not given', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/auth/login`, {})
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "type" should be "google", "facebook" or "apple".`
                })
        })

        it('should return 400, "token" not given', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/auth/login`, {
                type: 'google'
            })
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "token" should be given.`
                })
        });

        it('should return 400, "token_type" invalid', async () => {
            const req = axios.post(`${config.serverBaseUrl}/api/auth/login`, {
                type: 'google',
                token: 'client id_token'
            })
            expect(req)
                .to.eventually.be.rejectedWith(Error)
                .and.have.nested.include({
                    'response.status': 400,
                    'response.data.message': `body parameter "token_type" should be "id_token" or "access_token".`
                })
        });

        it('should return "meme_token"', async () => {
            const res = await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
                type: 'google',
                token: 'client id_token',
                token_type: 'id_token'
            })
            const data = res.data
            expect(res.status).to.be.equal(200)
            expect(data.meme_token).to.be.a('string')
        });
    })
})