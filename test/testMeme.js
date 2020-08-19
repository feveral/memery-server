const app = require('../app.js')
const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const expect = chai.expect

describe('MemeApi', function () {

    let memeToken = ''
    let authorization = () => {return `Bearer ${memeToken}`}
    let axiosHeader = () => {return {headers: {Authorization: authorization()}}}

    let memeId = ''

    before(async () => {
        memeToken = (await axios.post(`${config.serverBaseUrl}/api/auth/login`, {
            type: 'google',
            token: 'client id_token',
            token_type: 'id_token'
        })).data.meme_token
    })

    describe('#POST /api/meme/', () => {
        
    });
});