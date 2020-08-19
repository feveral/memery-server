const app = require('../app.js')
const axios = require('axios')
const chai = require('./libs/chaiInitialize.js')
const config = require('../config.js')
const expect = chai.expect

describe('ImageApi', function () {

    before(done => {
        app.on('app_started', done())
    })

    describe('#POST /api/image/', () => {
        
    });
});